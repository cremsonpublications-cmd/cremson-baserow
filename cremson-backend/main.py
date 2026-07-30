from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    users,
    orders,
    products,
    categories,
    reviews,
    coupons,
    specimen_requests,
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

app = FastAPI(
    title="Cremson Backend API",
    version="1.0.0",
    description="REST API layer that proxies Baserow tables for the Cremson Next.js frontend.",
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


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Cremson Backend API running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
