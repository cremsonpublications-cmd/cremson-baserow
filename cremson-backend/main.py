import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import (
    users,
    orders,
    products,
    categories,
    reviews,
    coupons,
    specimen_requests,
    specimen_books,
    shipping_settings,
)
from routers import auth as auth_router
from routers import addresses as addresses_router
from routers import admin as admin_router
from routers import payment as payment_router
from routers import cart as cart_router
from routers import wishlist as wishlist_router
from routers import webhooks as webhooks_router
from routers import whatsapp as whatsapp_router
from routers import crm as crm_router
from routers import blogs as blogs_router
from routers import study_materials as study_materials_router
from routers import teaching_resources as teaching_resources_router
from routers import study_material_posts as study_material_posts_router
from routers import teaching_resource_posts as teaching_resource_posts_router
from routers import bulk_orders as bulk_orders_router
from routers import banners as banners_router
from routers import reminders as reminders_router

app = FastAPI(
    title="Cremson Backend API",
    version="1.0.0",
    description="REST API layer that proxies Baserow tables for the Cremson Next.js frontend.",
)


@app.exception_handler(httpx.HTTPStatusError)
async def httpx_status_error_handler(request, exc: httpx.HTTPStatusError):
    try:
        err_data = exc.response.json()
        error_code = err_data.get("error")
        detail = err_data.get("detail") or error_code or str(exc)
        
        # User-friendly translation for unique constraint errors
        if error_code == "ERROR_FIELD_DATA_CONSTRAINT" or "violates a field constraint" in str(detail):
            path = request.url.path
            if "teachers" in path:
                detail = "A teacher with this Whatsapp Phone number already exists."
            else:
                detail = "This record violates a database unique constraint."
    except Exception:
        detail = exc.response.text or str(exc)
    return JSONResponse(
        status_code=exc.response.status_code,
        content={"detail": detail}
    )

@app.exception_handler(httpx.RequestError)
async def httpx_request_error_handler(request, exc: httpx.RequestError):
    return JSONResponse(
        status_code=503,
        content={"detail": f"Database service connection failure: {str(exc)}"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["Auth"])
app.include_router(addresses_router.router, prefix="/api/addresses", tags=["Addresses"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Admin"])
app.include_router(payment_router.router, prefix="/api/payment", tags=["Payment"])
app.include_router(cart_router.router, prefix="/api/cart", tags=["Cart"])
app.include_router(wishlist_router.router, prefix="/api/wishlist", tags=["Wishlist"])
app.include_router(webhooks_router.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(whatsapp_router.router, prefix="/api/webhooks", tags=["WhatsApp Chat Webhook"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(coupons.router, prefix="/api/coupons", tags=["Coupons"])
app.include_router(
    specimen_requests.router,
    prefix="/api/specimen-requests",
    tags=["Specimen Requests"],
)
app.include_router(
    shipping_settings.router,
    prefix="/api/shipping-settings",
    tags=["Shipping Settings"],
)
app.include_router(crm_router.router, prefix="/api/crm", tags=["CRM"])
app.include_router(specimen_books.router, prefix="/api/specimen-books", tags=["Specimen Books"])
app.include_router(blogs_router.router, prefix="/api/blogs", tags=["Blogs"])
app.include_router(study_materials_router.router, prefix="/api/study-materials", tags=["Study Materials"])
app.include_router(teaching_resources_router.router, prefix="/api/teaching-resources", tags=["Teaching Resources"])
app.include_router(study_material_posts_router.router, prefix="/api/study-material-posts", tags=["Study Material Posts"])
app.include_router(teaching_resource_posts_router.router, prefix="/api/teaching-resource-posts", tags=["Teaching Resource Posts"])
app.include_router(bulk_orders_router.router, prefix="/api/bulk-orders", tags=["Bulk Orders"])
app.include_router(banners_router.router, prefix="/api/banners", tags=["Banners"])
app.include_router(reminders_router.router, prefix="/api/reminders", tags=["Reminders"])


import os
from fastapi.staticfiles import StaticFiles

# Mount uploads directory for static invoice PDFs and media
os.makedirs("uploads/invoices", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Cremson Backend API running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
