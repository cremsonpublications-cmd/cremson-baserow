# Cremson Publications — Complete Technical Documentation

> Full-stack e-commerce platform for selling educational books and textbooks.
> Backend: FastAPI (Python) | Frontend: Next.js 16 (React 19) | Database: Baserow

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [How to Run](#2-how-to-run)
3. [Project Structure](#3-project-structure)
4. [Backend — How It Works](#4-backend--how-it-works)
   - [Application Entry (main.py)](#41-application-entry-mainpy)
   - [Configuration (config.py)](#42-configuration-configpy)
   - [Baserow Service (services/baserow.py)](#43-baserow-service-servicesbaserowpy)
   - [Email Service (services/email.py)](#44-email-service-servicesemailpy)
   - [Payment Refunds (services/razorpay.py)](#45-payment-refunds-servicesrazorpaypy)
   - [Shipping (services/shipway.py)](#46-shipping-servicesshipwaypy)
   - [WhatsApp Notifications (services/whatsapp.py)](#47-whatsapp-notifications-serviceswhatsapppy)
   - [Database Layer (db/)](#48-database-layer-db)
5. [API Routers — All Endpoints](#5-api-routers--all-endpoints)
   - [Auth](#51-auth-apiauthpy)
   - [Products](#52-products-apiproductspy)
   - [Cart](#53-cart-apicartpy)
   - [Wishlist](#54-wishlist-apiwishlistpy)
   - [Orders](#55-orders-apiorderspy)
   - [Payment](#56-payment-apipaymentpy)
   - [Addresses](#57-addresses-apiaddressespy)
   - [Categories](#58-categories-apicategoriespy)
   - [Coupons](#59-coupons-apicouponspy)
   - [Reviews](#510-reviews-apireviewspy)
   - [Admin](#511-admin-apiadminpy)
   - [Bulk Orders](#512-bulk-orders-apibulk_orderspy)
   - [CRM (Teacher/School)](#513-crm-apicrmpy)
   - [Blogs](#514-blogs-apiblogspy)
   - [Specimen Requests](#515-specimen-requests-apispecimen_requestspy)
   - [Other Routers](#516-other-routers)
6. [Frontend — How It Works](#6-frontend--how-it-works)
   - [Root Layout](#61-root-layout-applayoutjs)
   - [Global State (AppContext.js)](#62-global-state-contextappcontextjs)
   - [Axios API Client](#63-axios-api-client-libapiaaxiosjs)
   - [API Service Layer (lib/api/)](#64-api-service-layer-libapi)
7. [Frontend Components](#7-frontend-components)
8. [Frontend Pages](#8-frontend-pages)
9. [Core Workflows (End-to-End)](#9-core-workflows-end-to-end)
   - [Authentication Flow](#91-authentication-flow)
   - [Payment Flow](#92-payment-flow)
   - [Cart Persistence Logic](#93-cart-persistence-logic)
   - [Discount Logic](#94-discount-logic)
   - [WhatsApp Chat Order Flow](#95-whatsapp-chat-order-flow)
10. [Database Tables (Baserow)](#10-database-tables-baserow)
11. [External Services](#11-external-services)
12. [Tech Stack](#12-tech-stack)

---

## 1. Project Overview

Cremson Publications is a full-stack e-commerce platform with two main parts:

| Part | Tech | Port |
|------|------|------|
| `cremson-backend/` | FastAPI (Python) REST API | 8000 |
| `cremson-next-ui/` | Next.js 16, React 19, App Router | 3000 |

**Database:** Baserow (self-hosted at `http://200.141.5.200`) — all data lives here, accessed via REST API from the backend.

**No traditional SQL database.** Every read/write goes through the Baserow HTTP API, abstracted by `services/baserow.py`.

---

## 2. How to Run

### Automated (Recommended)

```bash
./start.sh
```

This script:
1. Activates the Python virtual environment
2. Runs `pip install` if needed
3. Runs `npm install` if needed
4. Starts the FastAPI backend on port 8000
5. Starts the Next.js frontend on port 3000
6. Waits for a backend health check before finishing

### Manual

```bash
# Terminal 1 — Backend
cd cremson-backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd cremson-next-ui
npm run dev
```

### URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Frontend |
| `http://localhost:8000` | Backend API |
| `http://localhost:8000/docs` | Swagger API docs (auto-generated) |

---

## 3. Project Structure

```
Cremson-Baserow/
├── start.sh                        # Starts both servers
├── .mcp.json                       # Supabase MCP config
├── README.md                       # This file
│
├── cremson-backend/
│   ├── main.py                     # FastAPI app setup, all 29 routers registered
│   ├── config.py                   # Env loading + TABLE_IDS map
│   ├── requirements.txt
│   ├── .env                        # All secrets (never commit)
│   ├── routers/                    # 29 API route modules
│   ├── services/
│   │   ├── baserow.py              # Baserow API client (CRUD)
│   │   ├── email.py                # Brevo SMTP transactional emails
│   │   ├── razorpay.py             # Payment refunds
│   │   ├── shipway.py              # Shipping/label/tracking
│   │   └── whatsapp.py             # WhatsApp order notifications
│   ├── db/
│   │   └── auth.py                 # User/cart/wishlist/address DB helpers
│   ├── schemas/                    # Pydantic request/response models
│   └── utils/                      # Shared utilities
│
└── cremson-next-ui/
    ├── app/                        # Next.js App Router pages
    │   ├── layout.js               # Root layout + providers + SEO
    │   ├── page.js                 # Homepage (banner + bestsellers + blogs)
    │   ├── shop/                   # Product listing + detail
    │   ├── cart/                   # Cart page
    │   ├── checkout/               # Checkout + Razorpay payment
    │   ├── auth/                   # signin, signup, verify-email, teacher-signup
    │   ├── my-orders/              # Order history
    │   ├── blogs/                  # Blog listing + detail page
    │   ├── specimen/               # Specimen book requests (teachers)
    │   ├── wishlist/               # Wishlist page
    │   └── admin/                  # 20+ admin dashboard pages
    ├── components/                 # 16 shared React components
    ├── context/
    │   └── AppContext.js           # Global state: cart, wishlist, user, token, search
    ├── lib/
    │   ├── api/
    │   │   ├── axios.js            # Axios client with auth interceptors
    │   │   ├── products.js         # Product fetch + mapProduct() normalizer
    │   │   ├── cart.js             # Cart API calls
    │   │   ├── wishlist.js         # Wishlist API calls
    │   │   ├── orders.js           # Order fetch + mapOrder() normalizer
    │   │   ├── auth.js             # Auth API calls
    │   │   └── addresses.js        # Address CRUD
    │   └── providers/
    │       └── QueryProvider.jsx   # TanStack React Query provider
    ├── data/books.js               # Static fallback banner/product data
    ├── .env.local                  # NEXT_PUBLIC_API_URL=http://localhost:8000
    └── .env.production             # NEXT_PUBLIC_API_URL=http://200.141.5.200:8000
```

---

## 4. Backend — How It Works

### 4.1 Application Entry (main.py)

FastAPI app initialized with title "Cremson Backend API" v1.0.0.

**Exception Handlers (global):**
- `httpx.HTTPStatusError` — catches Baserow API errors, translates unique constraint violations into human-readable messages (e.g., "A teacher with this WhatsApp number already exists")
- `httpx.RequestError` — returns 503 when Baserow is unreachable

**Middleware:**
- CORS: all origins allowed (`*`) — permits frontend and mobile clients

**Static Files:**
- `/uploads` directory mounted — serves invoice PDFs and local images

**Startup Event:**
- Calls `init_campaigns_db()` — initializes WhatsApp campaigns SQLite cache

**Health Endpoints:**
- `GET /` → `{"status": "ok"}`
- `GET /health` → `{"status": "healthy"}`

**29 Routers Registered** at `/api/*` prefixes — all logic lives in `routers/`.

---

### 4.2 Configuration (config.py)

All config loaded from `.env` file using `python-dotenv`.

**Key Environment Variables:**

| Variable | Purpose |
|----------|---------|
| `BASEROW_URL` | Baserow instance URL |
| `BASEROW_TOKEN` | Baserow API token |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_ALGORITHM` | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL (default 10080 = 7 days) |
| `RAZORPAY_KEY_ID / KEY_SECRET` | Payment processing |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API token |
| `BREVO_SMTP_*` | Email sending credentials |
| `SHIPWAY_USERNAME / LICENSE_KEY` | Shipping integration |
| `CLOUDINARY_*` | Image hosting |

**TABLE_IDS — Baserow Table Map:**

| Table Name | Table ID |
|------------|----------|
| auth_users | 769 |
| email_otps | 770 |
| user_addresses | 771 |
| products | 763 |
| categories | 764 |
| reviews | 765 |
| coupons | 766 |
| orders | 762 |
| bulk_orders | 767 |
| cart_items | 772 |
| wishlist_items | 773 |
| school | 876 |
| teacher | 877 |
| specimen_requests | 878 |
| whatsapp_campaigns | 881 |
| question_bank | 884 |

---

### 4.3 Baserow Service (services/baserow.py)

The entire database layer. **No SQL.** All reads/writes go through Baserow's REST API.

**BaserowClient Class:**

Authentication: `Authorization: Token {BASEROW_TOKEN}` header on every request.

**Field Caching:**
Before writing a row, the client fetches and caches the table's field schema. This prevents sending fields that don't exist in the table (which would cause Baserow to error).

**Key Methods:**

| Method | What It Does |
|--------|-------------|
| `get_table_fields(table_id)` | Fetches and caches field definitions for a table |
| `sanitize_payload(table_id, payload, row_id)` | Removes unknown fields, validates single-select values, appends invalid values to Notes |
| `get_rows(table_id, ...)` | Paginated rows with filtering, search, ordering |
| `get_rows_by_email(table_id, email)` | Case-insensitive email lookup |
| `get_row(table_id, row_id)` | Fetch a single row by ID |
| `create_row(table_id, data)` | Create with auto-sanitization |
| `update_row(table_id, row_id, data)` | Update with auto-sanitization |
| `delete_row(table_id, row_id)` | Delete a row |

**Filter Types Supported:**
- `equal` — exact match
- `contains` — substring match
- `link_row_has` — linked table row match
- `link_row_contains` — linked table row substring match

**Pagination:**
`get_rows` uses `page` + `size` params. Multiple pages fetched by callers in a loop when all data is needed.

---

### 4.4 Email Service (services/email.py)

Uses `aiosmtplib` (async SMTP) with Brevo (smtp-relay.brevo.com:587).

**Email Templates Sent:**

| Function | Trigger |
|----------|---------|
| `send_verification_email` | User signup → sends 6-digit OTP, 15 min expiry |
| `send_teacher_signup_email` | Teacher registers → "We've received your application" |
| `send_teacher_approved_email` | Admin approves teacher → grants specimen access |
| `send_bulk_order_received` | Bulk order submitted |
| `send_bulk_order_approved` | Admin approves bulk order with discount |
| `send_bulk_order_payment_received` | Payment confirmed |
| `send_bulk_order_shipped` | Order shipped with tracking |

All emails use responsive HTML with the brand's red theme (`#dc2626`). Success/approval emails use green (`#059669`).

---

### 4.5 Payment Refunds (services/razorpay.py)

**Function:** `issue_refund(payment_id, amount_rupees, reason, notes)`

- Calls Razorpay Refunds API v1 with Basic Auth (`key_id:key_secret`)
- Converts INR to paise (multiplies by 100) before sending
- Returns `{success, refund_id, amount, status, error}`
- Logs every attempt and its outcome

---

### 4.6 Shipping (services/shipway.py)

Integrates with Shipway's v2 API using Basic Auth.

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `clean_city_for_shipway(pincode, city)` | Normalizes city names for major metros (Mumbai, Delhi, Bengaluru) based on pincode prefix |
| `create_shipment(order_id, user_info, address, items, summary)` | Creates shipment record, returns AWB + label URL |
| `request_pickup(order_id, ...)` | Schedules pickup from warehouse |
| `get_tracking(awb_number)` | Fetches current tracking status |

**Carrier Mapping:** Known carrier IDs map to Delhivery, Blue Dart, DTDC, Xpressbees, Amazon Shipping.

**Webhook Parsing:** `parse_shipway_webhook()` translates Shipway status codes into order status strings (shipped, delivered, etc.).

---

### 4.7 WhatsApp Notifications (services/whatsapp.py)

Uses Meta Graph API v25.0 to send templated WhatsApp messages.

**Core Logic:**
1. All messages use pre-approved WhatsApp templates (configured in Meta Business Manager)
2. Phone numbers are normalized to `91XXXXXXXXXX` (Indian format) by `_format_phone()`
3. Dynamic URL buttons have their localhost URLs replaced with production URLs by `_clean_url_param()`

**Notifications Sent:**

| Function | Trigger |
|----------|---------|
| `send_order_confirmation` | Payment verified |
| `send_payment_success` | Payment received |
| `send_payment_failed` | Payment failure |
| `send_shipment_created` | Shipway shipment created, includes tracking URL |

**Batch Sending:** Supports bulk campaign sends with rate limiting for marketing messages.

---

### 4.8 Database Layer (db/)

`db/auth.py` provides high-level helpers on top of BaserowClient for user and cart operations.

**User Management:**

| Function | What It Does |
|----------|-------------|
| `create_user(...)` | Creates auth record in table 769; encodes role/permissions as `key: value` pairs in Notes field separated by `;` |
| `get_user_by_email(email)` | Case-insensitive search in auth_users |
| `get_user_by_phone(phone)` | Searches auth_users → user_addresses → teacher CRM |
| `get_user_by_id(id)` | Direct fetch by row ID |
| `mark_user_verified(email)` | Sets `is_verified=1` after OTP |
| `is_guest_user(user)` | Checks for `WHATSAPP_ADMIN` in Notes field |
| `activate_guest_to_active(...)` | Upgrades WhatsApp-created guest to full account |

**Metadata in Notes Field:**
User metadata (role, is_approved, designation, permissions) is stored as a plain-text encoded string in the Notes field of each Baserow row:
```
role: teacher; is_approved: 1; designation: HOD; permissions: orders,crm
```

**Cart Operations:**

| Function | What It Does |
|----------|-------------|
| `get_cart(user_id)` | Fetches all cart rows for user |
| `upsert_cart_item(user_id, product_id, qty, snapshot)` | Adds new or increments existing; stores product snapshot |
| `sync_cart(user_id, items)` | Bulk sync — merges client cart into backend, deduplicates |

Cart rows store a **product snapshot** (title, price, image, author, category) at the time of adding. This preserves display data even if the product changes later.

**Wishlist Operations:**
- `get_wishlist(user_id)` → returns list of product IDs
- `add_wishlist_item`, `remove_wishlist_item`
- `sync_wishlist(user_id, product_ids)` — bulk sync from local state

**Address Management:**
Each address has: label, first_name, last_name, company, street_address, apartment, city, state, pin_code, phone, country, is_default.

**OTP Management:**
- `save_otp(email, otp, expires_at)` — stores OTP with TTL in table 770
- `get_valid_otp(email, otp)` — checks not expired and not consumed
- `consume_otp(otp_id)` — marks as used (can't be reused)

---

## 5. API Routers — All Endpoints

All routes are prefixed with `/api/`. Authentication uses `Authorization: Bearer {JWT}` header.

---

### 5.1 Auth (`api/auth.py`)

**JWT Config:** HS256 algorithm, 10080-minute (7-day) default expiry. Passwords hashed with bcrypt.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Customer signup (name, email, phone, password) → sends OTP |
| POST | `/api/auth/teacher-signup` | No | Teacher registration with school, ID card upload |
| POST | `/api/auth/verify-email` | No | Verify OTP → activates account |
| POST | `/api/auth/resend-otp` | No | Resend verification OTP |
| POST | `/api/auth/login` | No | Email + password → returns JWT |
| POST | `/api/auth/forgot-password` | No | Send reset OTP |
| POST | `/api/auth/reset-password` | No | Reset with OTP + new password |
| POST | `/api/auth/send-whatsapp-verify-otp` | No | WhatsApp OTP for phone verification |
| POST | `/api/auth/verify-whatsapp-otp` | No | Verify WhatsApp OTP |
| GET | `/api/auth/me` | Yes | Current user profile |
| GET | `/api/auth/teacher-status` | No | Check teacher approval by phone number |

**Special Case — Guest Activation:**
If a user tries to sign up with a phone number that already exists as a WhatsApp-created guest, the system activates that guest account instead of creating a duplicate.

---

### 5.2 Products (`api/products.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products/` | No | Paginated list (search, is_active, category filter) |
| GET | `/api/products/{id}` | No | Single product details |
| POST | `/api/products/` | Admin | Create product |
| PATCH | `/api/products/{id}` | Admin | Update product |
| DELETE | `/api/products/{id}` | Admin | Delete product |

**Product Fields:** name, author, MRP, own_discount_percentage, category, description, short_description, main_image, side_images, stock_status, ISBN, edition, weight, dimensions, class_level, subcategories, combo_product_ids, is_active, tags.

---

### 5.3 Cart (`api/cart.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart/` | Yes | Get current user's cart |
| POST | `/api/cart/` | Yes | Add/update item (product_id, quantity, snapshot) |
| PUT | `/api/cart/{product_id}` | Yes | Update item quantity |
| DELETE | `/api/cart/{product_id}` | Yes | Remove one item |
| DELETE | `/api/cart/` | Yes | Clear entire cart |
| POST | `/api/cart/sync` | Yes | Bulk sync from client (used on login) |

---

### 5.4 Wishlist (`api/wishlist.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist/` | Yes | Get wishlist product IDs |
| POST | `/api/wishlist/` | Yes | Add product to wishlist |
| DELETE | `/api/wishlist/{product_id}` | Yes | Remove product |
| DELETE | `/api/wishlist/` | Yes | Clear entire wishlist |
| POST | `/api/wishlist/sync` | Yes | Bulk sync from client |

---

### 5.5 Orders (`api/orders.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders/` | Yes | List user's orders (filtered by email) |
| GET | `/api/orders/{id}` | Yes | Single order details |
| POST | `/api/orders/` | Yes | Create order record |
| PATCH | `/api/orders/{id}` | Admin | Update order status |
| DELETE | `/api/orders/{id}` | Yes | Cancel order |
| POST | `/api/orders/download-labels-zip` | Admin | Bulk download Shipway labels as ZIP |

**Order Status Workflow:**
```
Confirmed → Ready to Pack → Shipped → Delivered
```

**Label Download Logic:**
If the stored label URL returns 403 (Shipway CDN expiry), the system auto-requests a new label from Shipway before zipping.

---

### 5.6 Payment (`api/payment.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payment/create-order` | Yes | Create Razorpay order, returns order_id + amount |
| POST | `/api/payment/verify-payment` | Yes | Verify signature, create DB order, trigger shipment |
| POST | `/api/payment/webhook` | No | Razorpay webhook handler |

**Payment Verification Logic:**
1. Receives `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
2. Computes `HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)`
3. Compares with received signature
4. On match: creates order in Baserow, returns success immediately
5. Shipment creation runs as a **background task** (doesn't block response)

---

### 5.7 Addresses (`api/addresses.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/addresses/` | Yes | List user's addresses |
| POST | `/api/addresses/` | Yes | Add new address |
| PUT | `/api/addresses/{id}` | Yes | Edit address |
| DELETE | `/api/addresses/{id}` | Yes | Delete address |
| PUT | `/api/addresses/{id}/set-default` | Yes | Set as default checkout address |

---

### 5.8 Categories (`api/categories.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories/` | No | List with pagination |
| GET | `/api/categories/{id}` | No | Single category |
| POST | `/api/categories/` | Admin | Create (name, sub_categories, offer_type, discount_value) |
| PATCH | `/api/categories/{id}` | Admin | Update |
| DELETE | `/api/categories/{id}` | Admin | Delete |

Categories support per-category discount (percentage or flat), which applies to all products in that category if the product doesn't have its own discount.

---

### 5.9 Coupons (`api/coupons.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/coupons/` | No | List all coupons |
| GET | `/api/coupons/{id}` | No | Single coupon |
| POST | `/api/coupons/` | Admin | Create coupon |
| PATCH | `/api/coupons/{id}` | Admin | Update |
| DELETE | `/api/coupons/{id}` | Admin | Delete |

**Coupon Fields:** code, discount_type (percentage/flat), discount_value, min_order_amount, max_discount, expiry_date, free_delivery flag, first_order_only flag, applicable_products list.

---

### 5.10 Reviews (`api/reviews.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/` | No | List reviews (filterable by product) |
| POST | `/api/reviews/` | Yes | Create review (product_id, rating 1–5, comment) |
| DELETE | `/api/reviews/{id}` | Admin | Delete review |

Product names are fetched **asynchronously** in parallel for review list display.

---

### 5.11 Admin (`api/admin.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | No | Admin login → returns admin JWT |
| GET | `/api/admin/verify` | Admin | Verify admin token is valid |
| POST | `/api/admin/cloudinary/delete` | Admin | Delete image from Cloudinary |

**Admin Role Check:** Accepts users with role in `(admin, superadmin, staff)`.

**Hardcoded Fallback:** `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env` provides emergency admin access even if the database is down.

**Cloudinary Delete:** Uses HMAC-SHA1 signature verification before deleting to prevent unauthorized deletions.

---

### 5.12 Bulk Orders (`api/bulk_orders.py`)

School/institution bulk purchase workflow.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bulk-orders/` | No | Submit bulk order (school name, contact, items) |
| GET | `/api/bulk-orders/{id}` | No | Get single bulk order |
| PATCH | `/api/bulk-orders/{id}/approve` | Admin | Admin approves with discount |
| POST | `/api/bulk-orders/{id}/split-payment` | Admin | Split total into N student payments |
| POST | `/api/bulk-orders/{id}/initiate-payment/{split_id}` | No | Pay one student's share via Razorpay |

**Split Payment Logic:**
- Admin divides total into N shares (e.g., 30 students)
- Each student gets a unique Razorpay order link
- Payments tracked individually
- Status: Draft → Approved → Partially Paid → Fully Paid → Shipped
- WhatsApp/email notifications at every stage

---

### 5.13 CRM (`api/crm.py`)

Teacher and school management.

- Create, search, update, approve/reject teacher records
- Link teachers to schools
- Track specimen request history per teacher
- Manage affiliation codes for school verification
- Staff assignment and contact management

---

### 5.14 Blogs (`api/blogs.py`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/blogs/` | No | List published blogs (SQLite-cached for performance) |
| GET | `/api/blogs/{slug}` | No | Single blog by slug |
| POST | `/api/blogs/` | Admin | Create blog post |
| PATCH | `/api/blogs/{id}` | Admin | Update (publish/draft toggle) |
| DELETE | `/api/blogs/{id}` | Admin | Delete |

**SQLite Caching:** Blog list view is cached locally to reduce Baserow API calls on high-traffic pages.

---

### 5.15 Specimen Requests (`api/specimen_requests.py`)

Teachers can request free specimen/sample copies of books.

- `POST /api/specimen-requests/` — submit request (requires teacher approval)
- `GET /api/specimen-requests/` — list (admin: all; teacher: own)
- `PATCH /api/specimen-requests/{id}` — admin approves/rejects
- `POST /api/specimen-requests/{id}/dispatch` — mark as dispatched with tracking
- Email + WhatsApp notifications on approval and dispatch

---

### 5.16 Other Routers

| Router | Purpose |
|--------|---------|
| `users.py` | User profile updates (name, phone, preferences) |
| `webhooks.py` | Receives Razorpay + Shipway webhook events |
| `whatsapp_campaigns.py` | Bulk WhatsApp campaign sending to recipient lists |
| `whatsapp.py` | WhatsApp chat integration for customer support |
| `chatwoot_webhook.py` | Chatwoot live chat webhook relay |
| `reminders.py` | Scheduled reminder notifications |
| `banners.py` | Homepage banner image management |
| `question_paper_generator.py` | Question bank and paper generation tool |
| `shipping_settings.py` | Shipping cost rules (free above threshold, per-zone rates) |

---

## 6. Frontend — How It Works

### 6.1 Root Layout (app/layout.js)

Every page is wrapped by this layout.

**What it does:**
1. Sets SEO metadata: title, description, keywords, Open Graph tags
2. Wraps children with `AppProvider` (global cart/wishlist/user state)
3. Wraps with `QueryProvider` (TanStack React Query for server state)
4. Renders `SiteShell` which includes Header, Footer, CartDrawer, WishlistDrawer
5. Loads Google Analytics (`G-X0S2F4TPJH`) via script tag
6. Sets `lang="en"` and suppresses hydration warnings for SSR compatibility

---

### 6.2 Global State (context/AppContext.js)

Single source of truth for all shared frontend state. Access via `useApp()` hook in any component.

**State Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `cart` | Array | `[{rowId, product: {id, title, price, originalPrice, image, author, category}, quantity}]` |
| `wishlist` | Array | List of product IDs |
| `user` | Object | `{id, email, phone, role, is_verified}` or null |
| `authToken` | String | JWT bearer token |
| `allProducts` | Array | Full product catalog (loaded once at app mount) |
| `appliedCoupon` | Object | Current discount coupon (persisted in sessionStorage) |
| `isCartOpen` | Boolean | Cart drawer visibility |
| `isWishlistOpen` | Boolean | Wishlist drawer visibility |
| `isMobileMenuOpen` | Boolean | Mobile hamburger menu visibility |
| `searchQuery` | String | Current search input value |

**Key Actions:**

| Action | What It Does |
|--------|-------------|
| `addToCart(product)` | Adds product or increments quantity, syncs to backend if logged in, shows custom toast |
| `removeFromCart(productId)` | Removes item, syncs to backend |
| `updateQuantity(productId, delta)` | Adds/subtracts delta from item quantity |
| `clearCart()` | Empties entire cart |
| `toggleWishlist(book)` | Adds or removes from wishlist with toast notification |
| `authLogin(token, userData)` | Saves token and user, merges local cart/wishlist to backend |
| `authLogout()` | Clears all state, localStorage, redirects to home |

**Product Loading on Mount:**
```
App mounts
  → Not on /admin or /auth paths?
    → fetchAllProducts() (paginated, 200 per page)
      → Stores in allProducts
        → Updates cart snapshots with fresh prices/images
```

**Cart Toast:**
Custom Sonner toast with: product image, action label (added/increased/decreased/removed), current quantity, subtotal, "View Cart" button. Auto-dismisses after 3.5 seconds.

---

### 6.3 Axios API Client (lib/api/axios.js)

All frontend HTTP requests go through this configured Axios instance.

**Dynamic Base URL:**
```
if (window.location.hostname !== 'localhost')
  → always use https://api.cremsonpublications.com
else
  → use NEXT_PUBLIC_API_URL (from .env.local) or http://localhost:8000
```

**Request Interceptor (runs before every request):**
1. For `/admin` routes → attach `localStorage.cremson_admin_token`
2. For all other routes → attach `localStorage.cremson_token`
3. Header format: `Authorization: Bearer {token}`

**Response Interceptor (runs after every response):**

On success (2xx):
- If POST/PUT/PATCH/DELETE and response has `message` → show Sonner success toast

On error:
- Timeout → toast "Request timed out"
- No network → toast "Cannot connect to server"
- 401 Unauthorized:
  - Admin routes → clear `cremson_admin_token`, redirect to `/admin/login`
  - User routes → clear `cremson_token`, redirect to `/auth/signin`
- 422 Validation Error → parse Pydantic v2 error format, show field-level messages
- Other errors → show `error.detail` or fallback message

---

### 6.4 API Service Layer (lib/api/)

**products.js — mapProduct(p):**

Transforms a raw Baserow row into a clean frontend product object:

```
Raw Baserow row
  → Parse combo_product_ids (handles JSON string, CSV string, embedded string)
  → Parse bulk_pricing JSON
  → Parse sub_categories
  → Calculate final_price = MRP × (1 - own_discount_percentage / 100)
  → Set is_combo flag (from flags, tags, or author = "Cremson Bundle")
  → Fill image defaults
  → Return typed product object
```

`fetchAllProducts()` loops through pages (200 per page) until Baserow returns no more results, then returns the full merged array.

**cart.js:**
Wraps all cart API calls. `syncCart(items)` sends the full local cart to `/api/cart/sync` which merges it into the user's backend cart on login.

**auth.js:**
`getMe(token)` is called on app mount to restore session — if token in localStorage is valid, user is restored without re-login.

**orders.js — mapOrder(row):**
Transforms a raw order Baserow row:
```
raw row
  → Parse user_info JSON (name, email, phone)
  → Parse items JSON array
  → Parse order_summary JSON (subtotal, tax, shipping, total)
  → Parse delivery JSON (address)
  → Map status codes to display labels
  → Return displayable order object
```

---

## 7. Frontend Components

### Header.js
Main navigation bar with:
- **CP Logo** (left)
- **Search bar** — updates `AppContext.searchQuery`, submits to `/shop?search=...`
- **Shop dropdown** — hierarchical categories (loaded from `/api/categories/`)
- **Study Materials** dropdown (lazy-loaded, 2s delay)
- **Teaching Resources** dropdown (lazy-loaded, 2s delay)
- **Cart icon** — shows item count badge, opens CartDrawer
- **Wishlist icon** — shows count badge, opens WishlistDrawer
- **Auth buttons** or **Profile dropdown** (if logged in)
  - Profile dropdown: Account, Orders, Wishlist, Logout
- **Mobile menu toggle** — hamburger for screens smaller than md breakpoint

### CartDrawer.js
Slide-out drawer from the right:
- Per-item: image, title, price, quantity (±) controls, remove button
- Cart subtotal
- "Proceed to Checkout" CTA
- Empty state message

### WishlistDrawer.js
Slide-out drawer:
- Per-item: image, title, price, "Add to Cart" button, remove heart
- Empty state message

### Footer.js
- Company address, phone, email, WhatsApp link
- Newsletter email signup
- Social media icons (Facebook, Twitter, Instagram, WhatsApp)
- Hidden on `/auth/*`, `/admin/*`, `/checkout` pages

### MobileMenuDrawer.js
Full-screen mobile navigation:
- Links: Shop, Products by Class, Study Materials, Teaching Resources, Specimen, Blogs
- Cart and Wishlist with counts
- Auth section: Sign In / Sign Up or logged-in user info + logout
- Expandable dropdowns for nested navigation

### WhatsAppChatWidget.js
Floating chat button (bottom-right corner):
- Opens full chat UI when clicked
- Conversation history kept in memory during session
- State machine for WhatsApp-based ordering:
  ```
  MAIN_MENU
    → Product selection
      → Quantity selection
        → Phone validation
          → Order confirmation
  ```
- Handles typing indicators, incoming messages
- Creates guest orders via WhatsApp admin flow
- Integrates with backend WhatsApp chat service

### ChatwootWidget.js
Loads the Chatwoot live support chat iframe — a third-party customer support platform embedded on the site.

### SiteShell.js
Thin wrapper: renders `<Header />` + `{children}` + `<Footer />` + all drawers/modals in the right layer order.

### Other Components
- `CustomDropdown.js` — reusable dropdown with click-outside handling
- `Newsletter.js` — email subscription form
- `SocialIcons.js` — social media icon links
- `CPLogo.js` — brand logo SVG

---

## 8. Frontend Pages

### Homepage (app/page.js)

Three sections, loaded in sequence:

1. **Banner Carousel** — fetches active banners from `/api/banners/`, auto-rotates every 6 seconds with manual prev/next controls
2. **Best Selling Books** — reads from `AppContext.allProducts`, renders product grid with skeleton loaders while loading
3. **Blog Feed** — fetches 4 latest published blogs (delayed 1.5s after products to prioritize above-fold content)

### Shop (app/shop/)

Product catalog with:
- **Filters:** Category, class level, price range slider
- **Sort:** Default, Price ascending, Price descending, Rating
- **Pagination:** 10 / 20 / 50 / 100 per page
- **Product Card:** image, title, author, price with MRP strikethrough, discount %, rating, Add to Cart, wishlist heart

### Product Detail (app/shop/product/[id])

- Image gallery: main image + thumbnail strip
- Product info: title, author, MRP, final price, discount %, stock status, rating, review count
- Tabs: Description / Short Description
- Add to Cart + Add to Wishlist buttons
- Related products grid
- Reviews section with stars and comments

### Cart (app/cart/)

- Line items: image, title, qty controls (±), unit price, line total
- Summary: subtotal, shipping, tax/GST, coupon discount, grand total
- Coupon code input with validation
- "Proceed to Checkout" CTA

### Checkout (app/checkout/)

Full checkout flow with auth guard (redirects guest to sign-in):

**Step 1 — Shipping Address:**
- Select from saved addresses
- OR enter new address
- Pincode auto-lookup via `postalpincode.in` → auto-fills city and state
- City normalization for major metros (Delhi, Mumbai, Bengaluru, etc.)
- Save new address option

**Step 2 — Order Summary + Payment:**
- Cart items, prices, quantities
- Shipping cost (fetched from admin settings; free above threshold)
- Coupon discount applied
- Grand total
- "Pay Now" → loads Razorpay checkout modal
  - Supports: credit card, debit card, UPI, net banking, wallets
- On Razorpay success → calls `/api/payment/verify-payment`
- Backend creates order, triggers Shipway shipment async
- Redirect to confirmation page

### My Orders (app/my-orders/)

- Table: Order ID, Date, Status badge, Items summary, Total, Actions
- Status labels: Confirmed → Order Placed, Shipped → Shipped, Delivered → Delivered
- Tracking link (Shipway) shown when AWB is available
- Download invoice button

### Auth Pages

| Page | What It Does |
|------|-------------|
| `/auth/signin` | Email + password form → JWT → `authLogin()` |
| `/auth/signup` | Name, email, phone, password → sends OTP → redirect to verify |
| `/auth/verify-email` | OTP input → account activated → auto-login |
| `/auth/teacher-signup` | Extended form: school, affiliation code, ID card upload → pending approval |

### Admin Dashboard (app/admin/)

20+ pages:
- Products — add, edit, image upload to Cloudinary, CSV bulk import
- Categories — manage with discount settings
- Coupons — create, activate/deactivate
- Orders — status updates, label download, initiate refunds
- Bulk Orders — approve, manage split payments per student
- Blogs — WYSIWYG editor (BlockNote), publish/draft toggle
- Banners — upload and activate homepage banners
- WhatsApp Campaigns — create recipient list, send bulk messages
- Question Bank — manage questions and generate papers
- Staff/User Management — create staff accounts with role-based permissions
- CRM — teacher and school records, approval workflow

---

## 9. Core Workflows (End-to-End)

### 9.1 Authentication Flow

```
Signup
  → POST /api/auth/register
    → bcrypt hash password
    → create user row in Baserow (auth_users table 769) with is_verified=0
    → generate 6-digit OTP, save to email_otps table (770) with 15-min expiry
    → send verification email via Brevo SMTP
  → Frontend: redirect to /auth/verify-email

Verify Email
  → POST /api/auth/verify-email {email, otp}
    → lookup OTP in table 770 (not expired, not consumed)
    → mark OTP consumed
    → set user is_verified=1 in table 769
    → return JWT (HS256, 7-day expiry)
  → Frontend: authLogin(token) → localStorage, sync cart/wishlist

Login
  → POST /api/auth/login {email, password}
    → fetch user by email
    → bcrypt verify password
    → check is_verified=1
    → return JWT with payload {user_id, email, role, is_admin}
  → Frontend: authLogin() → set user state, merge local cart into backend

Session Restore (on page load)
  → Check localStorage.cremson_token
  → If present: GET /api/auth/me
    → If valid: restore user state, sync cart from backend
    → If 401: clear token, treat as guest
```

---

### 9.2 Payment Flow

```
1. User clicks "Pay Now" in checkout
   → POST /api/payment/create-order {amount, currency: "INR"}
     → Razorpay API creates order → returns razorpay_order_id

2. Razorpay modal opens in browser
   → User pays via card/UPI/wallet
   → Razorpay calls frontend callback with:
     {razorpay_order_id, razorpay_payment_id, razorpay_signature}

3. Frontend: POST /api/payment/verify-payment
   → Backend computes:
     expected = HMAC-SHA256(
       razorpay_order_id + "|" + razorpay_payment_id,
       RAZORPAY_KEY_SECRET
     )
   → If expected == razorpay_signature:
     → Create order row in Baserow (orders table 762)
       {user_info, items, order_summary, delivery, payment: {razorpay_payment_id}}
     → Return {success: true, order_id} immediately
     → [Background task] Create Shipway shipment
       → Get AWB number + label URL
       → Update order row with AWB, label_url, status=READY_TO_PACK
       → Send WhatsApp order confirmation to customer
       → Send WhatsApp shipment created with tracking link

4. Frontend: clear cart → redirect to /my-orders
```

---

### 9.3 Cart Persistence Logic

```
Guest (not logged in):
  cart stored in localStorage['cremson_cart']
  wishlist stored in localStorage['cremson_wishlist']

User logs in:
  authLogin() called
  → POST /api/cart/sync {items: localCart}
    → Backend merges: if product exists in backend cart, add quantities; otherwise add new row
  → POST /api/wishlist/sync {product_ids: localWishlist}
    → Backend adds missing items
  → localStorage cart/wishlist cleared
  → AppContext.cart now pulls from backend

User modifies cart:
  → addToCart() / removeFromCart() / updateQuantity()
    → Immediately updates local React state (optimistic)
    → Calls backend API to sync

User logs out:
  authLogout()
  → Clear localStorage.cremson_token
  → Clear AppContext user, cart, wishlist, token
  → Cart now backed by localStorage again (starts empty)
```

---

### 9.4 Discount Logic

Priority order (highest wins):

```
1. Product's own discount (own_discount_percentage field)
   If product has own_discount_percentage > 0:
     final_price = MRP × (1 - own_discount_percentage / 100)

2. Category discount (if product has no own discount)
   If category has discount_value:
     final_price = MRP × (1 - category.discount_value / 100)

3. Coupon discount (applied on top of final price at checkout)
   percentage: total × (1 - coupon_discount / 100)
   flat: total - coupon_value (never below 0)
   Capped at max_discount if set
   Only if order total ≥ min_order_amount

4. No discount → final_price = MRP
```

All discount computation happens in `lib/api/products.js:mapProduct()` on the frontend, mirrored in the checkout summary.

---

### 9.5 WhatsApp Chat Order Flow

```
Customer clicks floating WhatsApp button
  → WhatsAppChatWidget opens
  → Shows MAIN_MENU options

Customer selects "Order via WhatsApp"
  → State machine: PRODUCT_SELECTION
    → Customer types product name or picks from list
  → State machine: QUANTITY
    → Customer enters quantity
  → State machine: PHONE_VALIDATION
    → Customer provides phone number
    → Backend checks if phone exists in auth_users
    → If yes: use existing user (or guest account)
    → If no: create guest user (marked WHATSAPP_ADMIN in Notes)
  → State machine: ORDER_CONFIRMATION
    → Show order summary
    → Customer confirms
    → Create order in Baserow
    → Send WhatsApp confirmation to customer
    → Admin notified via WhatsApp
```

---

## 10. Database Tables (Baserow)

All data lives in Baserow at `http://200.141.5.200`. Each table is accessed via REST API.

| Table | ID | Purpose |
|-------|----|---------|
| orders | 762 | All customer orders, payment details, shipping status |
| products | 763 | Product catalog (name, price, images, discounts) |
| categories | 764 | Product categories with discount settings |
| reviews | 765 | Product reviews and ratings |
| coupons | 766 | Discount coupon codes and rules |
| bulk_orders | 767 | School/institution bulk orders |
| shipping_settings | 768 | Shipping cost rules and thresholds |
| auth_users | 769 | User accounts (email, password hash, role, verification) |
| email_otps | 770 | OTP records with expiry for email verification |
| user_addresses | 771 | Saved shipping addresses |
| cart_items | 772 | Backend cart rows (user_id + product snapshot + quantity) |
| wishlist_items | 773 | Backend wishlist rows (user_id + product_id) |
| shipment_history | 774 | Shipway tracking event history |
| school | 876 | School/institution CRM records |
| teacher | 877 | Teacher CRM records (approval status, affiliation) |
| specimen_requests | 878 | Teacher specimen book request records |
| books | 879 | Book metadata (separate from products) |
| subject | 880 | Subject classifications |
| whatsapp_campaigns | 881 | Marketing campaign records and recipient lists |
| question_bank | 884 | Question bank entries for paper generation |

---

## 11. External Services

| Service | Purpose | Credentials In |
|---------|---------|---------------|
| **Baserow** (`http://200.141.5.200`) | Primary database | `BASEROW_TOKEN` in `.env` |
| **Razorpay** (test mode `rzp_test_*`) | Payment processing | `RAZORPAY_KEY_ID/SECRET` in `.env` |
| **Brevo SMTP** (`smtp-relay.brevo.com:587`) | Transactional email | `BREVO_SMTP_*` in `.env` |
| **Meta WhatsApp Business API** (Graph v25.0) | Order + shipment notifications | `WHATSAPP_ACCESS_TOKEN` in `.env` |
| **Shipway** (API v2) | Shipping label creation + tracking | `SHIPWAY_USERNAME/LICENSE_KEY` in `.env` |
| **Cloudinary** (`cloud_name: dkxxa3xt0`) | Product image hosting | `CLOUDINARY_*` in `.env` |
| **Postalpincode.in** | Pincode → city/state lookup | Public API, no key required |
| **Google Analytics** (`G-X0S2F4TPJH`) | Frontend page tracking | Hardcoded in `layout.js` |
| **Chatwoot** | Customer support live chat | Account ID in env |

---

## 12. Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Language |
| FastAPI | Web framework (async) |
| uvicorn | ASGI server |
| httpx | Async HTTP client for Baserow API calls |
| Pydantic v2 | Request/response validation and serialization |
| python-jose | JWT creation and verification |
| passlib (bcrypt) | Password hashing |
| aiosmtplib | Async email sending |
| python-dotenv | Environment variable loading |

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 16.2.12 | React framework (App Router) |
| React 19 | UI library |
| TailwindCSS 4 | Utility-first CSS |
| Mantine UI | Component library |
| Axios | HTTP client with interceptors |
| TanStack React Query | Server state caching and synchronization |
| Sonner | Toast notifications |
| Lucide React | SVG icon library |
| BlockNote | WYSIWYG blog editor |
| Recharts | Admin dashboard charts |
| Marked | Markdown to HTML rendering (blogs) |
| Razorpay JS SDK | Payment checkout modal |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Baserow (self-hosted) | Primary database — no SQL, all data via REST API |
| Cloudflare Workers (`wrangler.jsonc`) | Edge deployment for the frontend |
| Supabase | Configured via MCP but not actively used for core operations |

---

## Admin Credentials

```
Email:    cremsonpublications@gmail.com
Password: 12345678
```

The admin token includes `is_admin: true` in the JWT payload and is stored in `localStorage.cremson_admin_token` separately from the regular user token (`localStorage.cremson_token`).

---

*End of documentation.*
