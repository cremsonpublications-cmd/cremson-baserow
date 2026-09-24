import os
import uuid
import hashlib
import time
import urllib.parse
import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile, Request, Query
from fastapi.responses import StreamingResponse

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


@router.post("/pdf")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    """Upload a PDF to Cloudinary as a signed upload with access_mode=public."""
    if file.content_type != "application/pdf" and not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    content = await file.read()
    filename = file.filename or "upload.pdf"

    # Allow caller to pass a folder field in the multipart form
    form = await request.form()
    folder = str(form.get("folder") or "study-material-pages/pdfs").strip()

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dkxxa3xt0").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()

    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="Cloudinary API credentials not configured.")

    ts = int(time.time())
    params = {
        "access_mode": "public",
        "folder": folder,
        "timestamp": ts,
    }
    sorted_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    signature = hashlib.sha1((sorted_str + api_secret).encode()).hexdigest()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                f"https://api.cloudinary.com/v1_1/{cloud_name}/raw/upload",
                data={**params, "api_key": api_key, "signature": signature},
                files={"file": (filename, content, "application/pdf")},
            )
        if res.status_code == 200:
            data = res.json()
            url = data.get("secure_url") or data.get("url") or ""
            if url:
                return {"status": "success", "url": url, "file_url": url, "secure_url": url, "filename": filename}
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {res.text}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF upload failed: {str(e)}")


@router.get("/pdf-proxy")
async def proxy_pdf(url: str = Query(..., description="Cloudinary raw PDF URL to proxy")):
    """
    Proxy a restricted Cloudinary raw PDF using signed Admin API download.
    Extracts the public_id from the URL, generates a signed download link,
    fetches the PDF, and streams it back with correct headers.
    """
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dkxxa3xt0").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()

    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="Cloudinary credentials not configured.")

    # Extract public_id from URL
    # URL format: https://res.cloudinary.com/{cloud}/raw/upload/v{ver}/{public_id}
    try:
        parsed = urllib.parse.urlparse(url)
        path = parsed.path  # e.g. /dkxxa3xt0/raw/upload/v1790235368/study-material-pages/pdfs/file.pdf
        parts = path.lstrip("/").split("/")
        # Find "upload" and take everything after the version token
        upload_idx = parts.index("upload")
        after_upload = parts[upload_idx + 1:]
        # Skip version token (starts with 'v' followed by digits)
        if after_upload and after_upload[0].startswith("v") and after_upload[0][1:].isdigit():
            after_upload = after_upload[1:]
        public_id = "/".join(after_upload)
    except Exception:
        raise HTTPException(status_code=400, detail="Could not extract public_id from URL.")

    # Generate signed download URL via Cloudinary Admin API
    ts = int(time.time())
    to_sign = f"public_id={public_id}&timestamp={ts}{api_secret}"
    signature = hashlib.sha1(to_sign.encode()).hexdigest()

    download_url = (
        f"https://api.cloudinary.com/v1_1/{cloud_name}/raw/download"
        f"?public_id={urllib.parse.quote(public_id, safe='')}"
        f"&api_key={api_key}&timestamp={ts}&signature={signature}"
    )

    filename = public_id.split("/")[-1] or "file.pdf"

    async def stream():
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("GET", download_url) as r:
                if r.status_code != 200:
                    raise HTTPException(status_code=r.status_code, detail="Failed to fetch PDF from Cloudinary.")
                async for chunk in r.aiter_bytes(chunk_size=8192):
                    yield chunk

    return StreamingResponse(
        stream(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
