import os
import uuid
import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile, Request

router = APIRouter()

@router.post("/image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload an image file (e.g. payment screenshot, logo, loader) to Cloudinary or local storage."""
    try:
        content = await file.read()
        filename = file.filename or "upload.png"

        # 1. Attempt Cloudinary upload first
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dkxxa3xt0").strip()
        upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET", "unsigned_preset").strip()

        try:
            async with httpx.AsyncClient(timeout=15.0) as http_client:
                c_res = await http_client.post(
                    f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
                    data={"upload_preset": upload_preset},
                    files={"file": (filename, content, file.content_type or "image/png")},
                )
                if c_res.status_code == 200:
                    c_data = c_res.json()
                    c_url = c_data.get("secure_url") or c_data.get("url")
                    if c_url:
                        return {
                            "status": "success",
                            "url": c_url,
                            "file_url": c_url,
                            "secure_url": c_url,
                            "filename": filename,
                            "provider": "cloudinary",
                        }
                else:
                    pass
        except Exception as cloud_err:
            pass  # Fallback to local storage below

        # 2. Local fallback storage
        os.makedirs("uploads/images", exist_ok=True)
        safe_filename = "".join(c for c in filename if c.isalnum() or c in (".", "_", "-")).rstrip()
        if not safe_filename:
            safe_filename = "upload.png"

        unique_filename = f"{uuid.uuid4().hex[:12]}_{safe_filename}"
        file_path = os.path.join("uploads/images", unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        base_url = str(request.base_url).rstrip("/")
        file_url = f"{base_url}/uploads/images/{unique_filename}"

        return {
            "status": "success",
            "url": file_url,
            "file_url": file_url,
            "secure_url": file_url,
            "filename": unique_filename,
            "provider": "local",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
