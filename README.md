# Cremson Publications — Complete Project Documentation

Full-stack e-commerce platform for selling educational books and textbooks. Built with FastAPI (Python) backend and Next.js 16 frontend, using Baserow as the primary headless database.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Quick Start](#3-quick-start)
4. [Project Structure](#4-project-structure)
5. [Environment Variables](#5-environment-variables)
6. [Database Tables (Baserow)](#6-database-tables-baserow)
7. [Backend — API Routers](#7-backend--api-routers)
8. [Frontend — Pages & Routing](#8-frontend--pages--routing)
9. [Authentication Flow](#9-authentication-flow)
10. [Product System](#10-product-system)
11. [Cart & Checkout Flow](#11-cart--checkout-flow)
12. [Payment Flow (Razorpay)](#12-payment-flow-razorpay)
13. [Shipping Flow (Shipway)](#13-shipping-flow-shipway)
14. [WhatsApp Integration](#14-whatsapp-integration)
15. [Email Integration (Brevo)](#15-email-integration-brevo)
16. [Specimen Request Flow](#16-specimen-request-flow)
17. [Bulk Order Flow](#17-bulk-order-flow)
18. [Admin Dashboard](#18-admin-dashboard)
19. [Image Storage (Cloudinary)](#19-image-storage-cloudinary)
20. [Deployment](#20-deployment)

---

## 1. System Architecture

```
Browser / Mobile
      │
      ▼
Next.js 16 Frontend (Port 3000)
      │  (REST API calls via Axios)
      ▼
FastAPI Backend (Port 8000)
      │
      ├── Baserow DB (http://200.141.5.200)     ← Primary database
      ├── Razorpay                               ← Payments
      ├── Shipway                                ← Shipping / Courier
      ├── Cloudinary                             ← Image storage
      ├── Brevo SMTP                             ← Transactional email
      ├── Meta WhatsApp Business API             ← Notifications & chatbot
      └── Supabase (configured, not core)
```

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.12, React 19, App Router |
| Styling | TailwindCSS 4, Mantine UI |
| State | TanStack React Query, AppContext (React Context) |
| HTTP Client | Axios (with interceptors) |
| UI Extras | Lucide React, Sonner (toasts), BlockNote (WYSIWYG), Recharts, Marked |
| Backend | Python, FastAPI, Uvicorn |
| HTTP Client (backend) | HTTPX (async) |
| Auth | python-jose (JWT), passlib (bcrypt) |
| Email | aiosmtplib, email-validator |
| Database | Baserow (self-hosted at `http://200.141.5.200`) |
| Infra | Cloudflare Workers (`wrangler.jsonc`), GitHub Actions CI/CD |

---

## 3. Quick Start

### Automated (Recommended)

```bash
./start.sh
```

The script:
1. Creates Python `venv` if not present
2. Installs Python dependencies from `cremson-backend/requirements.txt`
3. Installs Node.js dependencies in `cremson-next-ui/`
4. Starts FastAPI on port `8000` with health check
5. Starts Next.js on port `3000`

### Manual

```bash
# Backend (port 8000)
cd cremson-backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (port 3000)
cd cremson-next-ui
npm run dev
```

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Admin Panel | http://localhost:3000/admin |

### Admin Credentials

```
Email:    cremsonpublications@gmail.com
Password: 12345678
```

---

## 4. Project Structure

```
Cremson-Baserow/
├── README.md
├── start.sh                          # Automated dual-server startup
├── WHATSAPP_TEMPLATES.md             # All Meta-approved WA templates
├── whatsapp_chat_flow_and_templates.txt  # WhatsApp chatbot flow docs
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions: SSH deploy on tag push
│
├── cremson-backend/                  # FastAPI Backend
│   ├── main.py                       # App entry point, all 27 routers registered
│   ├── config.py                     # Env loading + TABLE_IDS map
│   ├── requirements.txt
│   ├── .env                          # All secrets
│   ├── routers/                      # 27 API route modules
│   │   ├── auth.py                   # Signup, login, verify OTP, me
│   │   ├── products.py               # Product CRUD, search, reorder
│   │   ├── categories.py             # Category management
│   │   ├── orders.py                 # Order management
│   │   ├── payment.py                # Razorpay payment initiation & verify
│   │   ├── cart.py                   # Cart CRUD
│   │   ├── wishlist.py               # Wishlist CRUD
│   │   ├── reviews.py                # Product reviews
│   │   ├── coupons.py                # Coupon apply/validate
│   │   ├── addresses.py              # User saved addresses
│   │   ├── users.py                  # User profile management
│   │   ├── shipping_settings.py      # Delivery charge rules
│   │   ├── admin.py                  # Admin stats, cloudinary delete
│   │   ├── banners.py                # Homepage carousel banners
│   │   ├── blogs.py                  # Blog posts CRUD
│   │   ├── study_materials.py        # Study material categories
│   │   ├── study_material_posts.py   # Study material post CRUD
│   │   ├── teaching_resources.py     # Teaching resource categories
│   │   ├── teaching_resource_posts.py # Teaching resource post CRUD
│   │   ├── specimen_books.py         # Specimen book catalog
│   │   ├── specimen_requests.py      # Specimen request submissions
│   │   ├── bulk_orders.py            # Bulk/institutional orders
│   │   ├── crm.py                    # CRM / school & teacher data
│   │   ├── reminders.py              # Automated reminder system
│   │   ├── whatsapp.py               # WhatsApp outbound notifications
│   │   ├── whatsapp_campaigns.py     # WhatsApp campaign management
│   │   └── webhooks.py               # Shipway & Razorpay webhooks
│   │
│   ├── services/
│   │   ├── baserow.py                # Baserow API client (CRUD + filters)
│   │   ├── email.py                  # Brevo SMTP email sender
│   │   ├── razorpay.py               # Razorpay order/verify
│   │   ├── shipway.py                # Shipway AWB, tracking, rates
│   │   └── whatsapp.py               # Meta WhatsApp API sender
│   │
│   ├── db/                           # Baserow query helpers per domain
│   ├── schemas/                      # Pydantic models
│   └── utils/                        # Helpers
│
└── cremson-next-ui/                  # Next.js Frontend
    ├── app/                          # App Router pages
    │   ├── layout.js                 # Root layout + providers
    │   ├── page.js                   # Home (carousel + bestsellers)
    │   ├── shop/
    │   │   ├── page.js               # Product listing with filters
    │   │   └── product/[id]/         # Product detail page
    │   ├── cart/                     # Cart page
    │   ├── checkout/                 # Checkout + address + payment
    │   ├── my-orders/                # Order history
    │   ├── wishlist/                 # Wishlist page
    │   ├── auth/
    │   │   ├── signin/               # Login page
    │   │   ├── signup/               # Customer signup
    │   │   ├── verify-email/         # OTP verification
    │   │   └── teacher-signup/       # Teacher registration
    │   ├── blogs/                    # Blog listing + detail
    │   ├── study-material/           # Study material listing + detail
    │   ├── teaching-resource/        # Teaching resource listing + detail
    │   ├── specimen/                 # Specimen request form
    │   ├── bulk-order/               # Bulk order form
    │   ├── contact-us/               # Contact form
    │   ├── my-orders/                # Order history
    │   ├── forgot-password/          # Password reset
    │   ├── privacy-policy/
    │   ├── terms-conditions/
    │   └── admin/                    # 20+ admin dashboard pages
    │
    ├── components/                   # Reusable UI components
    │   ├── Header.js                 # Nav, search, cart/wishlist icons
    │   ├── Footer.js
    │   ├── CartDrawer.js             # Slide-out cart drawer
    │   ├── WishlistDrawer.js         # Slide-out wishlist drawer
    │   └── MobileMenuDrawer.js       # Mobile hamburger menu
    │
    ├── context/
    │   └── AppContext.js             # Global: cart, wishlist, user, auth, search
    │
    ├── lib/
    │   ├── api/
    │   │   ├── axios.js              # Axios instance + interceptors
    │   │   ├── products.js           # Product fetch + mapProduct()
    │   │   ├── hooks.js              # TanStack React Query hooks
    │   │   └── [domain].js           # Per-domain API files
    │   └── providers/
    │       └── QueryProvider.jsx     # TanStack QueryClientProvider
    │
    ├── data/books.js                 # Static banner slides + default product data
    ├── .env.local                    # NEXT_PUBLIC_API_URL=http://localhost:8000
    ├── .env.production               # NEXT_PUBLIC_API_URL=http://200.141.5.200:8000
    └── next.config.mjs
```

---

## 5. Environment Variables

### Backend (`cremson-backend/.env`)

| Variable | Purpose |
|----------|---------|
| `BASEROW_URL` | `http://200.141.5.200` |
| `BASEROW_TOKEN` | Baserow API auth token |
| `JWT_SECRET` | JWT signing secret |
| `RAZORPAY_KEY_ID` | Razorpay test key (`rzp_test_*`) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `BREVO_SMTP_HOST` | Brevo SMTP host |
| `BREVO_SMTP_PORT` | Brevo SMTP port |
| `BREVO_SMTP_USER` | Brevo SMTP username |
| `BREVO_SMTP_PASS` | Brevo SMTP password |
| `META_WA_TOKEN` | Meta WhatsApp Business API token |
| `META_WA_PHONE_ID` | WhatsApp phone number ID |
| `SHIPWAY_USERNAME` | Shipway account username |
| `SHIPWAY_PASSWORD` | Shipway account password |
| `CLOUDINARY_CLOUD_NAME` | `dkxxa3xt0` |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Frontend (`cremson-next-ui/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Frontend Production (`cremson-next-ui/.env.production`)

```
NEXT_PUBLIC_API_URL=http://200.141.5.200:8000
```

---

## 6. Database Tables (Baserow)

All table IDs defined in `cremson-backend/config.py` as `TABLE_IDS`:

| Table Name | Baserow ID | Description |
|------------|-----------|-------------|
| Users (Auth) | 761 | Customer accounts, JWT auth, roles |
| Orders | 762 | Customer orders, payment status, AWB tracking |
| Products | 763 | Books, combos, display_order, dimensions, images |
| Categories | 764 | Book categories and subcategories |
| Reviews | 765 | Product ratings and customer reviews |
| Coupons | 766 | Discount codes and rules |
| Shipping Settings | 768 | Delivery charges and pincode rules |
| Auth Users | 769 | Auth session data |
| Email OTPs | 770 | Login/signup OTP codes |
| User Addresses | 771 | Saved delivery addresses |
| Cart Items | 772 | Guest and logged-in user cart |
| Wishlist Items | 773 | User wishlist |
| Shipment History | 774 | Shipway shipment records |
| School | 876 | School/institution data (CRM) |
| Teacher | 877 | Teacher accounts and verification status |
| Specimen Requests | 878 | Specimen book request submissions |
| Books | 879 | Specimen book catalog |
| Subject | 880 | Subject taxonomy |

---

## 7. Backend — API Routers

All routes prefixed with `/api/`. Full interactive docs at `http://localhost:8000/docs`.

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new customer |
| POST | `/api/auth/login` | Login, returns JWT token |
| POST | `/api/auth/send-otp` | Send email OTP |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| GET | `/api/auth/me` | Get current user from JWT |
| PUT | `/api/auth/me` | Update profile |

### Products (`/api/products/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List products (paginated, filterable, searchable) |
| POST | `/api/products/` | Create new product |
| GET | `/api/products/{id}` | Get product by ID |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| POST | `/api/products/reorder` | Bulk update display_order positions |

**Query Parameters for GET /api/products/:**
- `search` — name contains filter
- `category`, `category_id` — filter by category
- `author`, `edition`, `classes`, `sub_category` — multi-value filters
- `stock_status` — in_stock / out_of_stock / on_backorders
- `is_active` — true/false
- `is_combo` — filter combo bundles
- `max_price`, `sort_by` — price range and sorting
- `page`, `size` — pagination

### Orders (`/api/orders/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List orders (admin: all, user: own) |
| POST | `/api/orders/` | Create order |
| GET | `/api/orders/{id}` | Get order detail |
| PUT | `/api/orders/{id}` | Update order status |

### Payment (`/api/payment/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature |
| POST | `/api/payment/refund` | Initiate refund |

### Cart (`/api/cart/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/` | Get user's cart items |
| POST | `/api/cart/` | Add item to cart |
| PUT | `/api/cart/{id}` | Update cart item quantity |
| DELETE | `/api/cart/{id}` | Remove cart item |
| DELETE | `/api/cart/clear` | Clear entire cart |

### Wishlist (`/api/wishlist/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wishlist/` | Get wishlist |
| POST | `/api/wishlist/` | Add to wishlist |
| DELETE | `/api/wishlist/{id}` | Remove from wishlist |

### Categories (`/api/categories/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List all categories |
| POST | `/api/categories/` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |

### Reviews (`/api/reviews/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/` | List reviews (filter by product) |
| POST | `/api/reviews/` | Submit review |
| DELETE | `/api/reviews/{id}` | Delete review (admin) |

### Coupons (`/api/coupons/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coupons/` | List coupons (admin) |
| POST | `/api/coupons/validate` | Validate coupon code |
| POST | `/api/coupons/` | Create coupon |

### Addresses (`/api/addresses/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/addresses/` | Get saved addresses |
| POST | `/api/addresses/` | Save new address |
| PUT | `/api/addresses/{id}` | Update address |
| DELETE | `/api/addresses/{id}` | Delete address |

### Shipping Settings (`/api/shipping-settings/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipping-settings/` | Get delivery charge rules |
| PUT | `/api/shipping-settings/` | Update rules (admin) |

### Specimen Requests (`/api/specimen-requests/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/specimen-requests/` | List specimen requests |
| POST | `/api/specimen-requests/` | Submit specimen request |
| PUT | `/api/specimen-requests/{id}` | Update request status (admin) |

### Specimen Books (`/api/specimen-books/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/specimen-books/` | List available specimen books |

### Bulk Orders (`/api/bulk-orders/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bulk-orders/` | List bulk orders |
| POST | `/api/bulk-orders/` | Submit bulk order request |
| PUT | `/api/bulk-orders/{id}` | Update / approve bulk order |

### Blogs (`/api/blogs/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs/` | List blog posts |
| POST | `/api/blogs/` | Create blog post |
| GET | `/api/blogs/{slug}` | Get blog by slug |
| PUT | `/api/blogs/{id}` | Update blog |
| DELETE | `/api/blogs/{id}` | Delete blog |

### Study Materials (`/api/study-materials/`, `/api/study-material-posts/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/study-materials/` | List study material categories |
| GET | `/api/study-material-posts/` | List study material posts |
| GET | `/api/study-material-posts/{slug}` | Get post by slug |

### Teaching Resources (`/api/teaching-resources/`, `/api/teaching-resource-posts/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teaching-resources/` | List teaching resource categories |
| GET | `/api/teaching-resource-posts/` | List resource posts |

### Admin (`/api/admin/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard analytics |
| POST | `/api/admin/cloudinary/delete` | Delete Cloudinary image by public_id |

### Banners (`/api/banners/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/banners/` | Get homepage carousel banners |
| POST | `/api/banners/` | Create banner |
| PUT | `/api/banners/{id}` | Update banner |
| DELETE | `/api/banners/{id}` | Delete banner |

### CRM (`/api/crm/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crm/schools` | List schools |
| GET | `/api/crm/teachers` | List teachers |
| PUT | `/api/crm/teachers/{id}` | Update teacher (approve/reject) |

### WhatsApp (`/api/whatsapp/`, `/api/whatsapp-campaigns/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/send` | Send outbound WA template message |
| POST | `/api/whatsapp/webhook` | Receive incoming WA messages (chatbot) |
| POST | `/api/whatsapp-campaigns/` | Send bulk campaign messages |

### Webhooks (`/api/webhooks/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/shipway` | Receive Shipway delivery status updates |
| POST | `/api/webhooks/razorpay` | Receive Razorpay payment events |

---

## 8. Frontend — Pages & Routing

| Route | Description |
|-------|-------------|
| `/` | Homepage — carousel banners + top 8 bestsellers |
| `/shop` | Product listing — filters, search, sort, pagination |
| `/shop/product/[id]` | Product detail — images, description, add to cart |
| `/cart` | Cart page |
| `/checkout` | Checkout — address + coupon + payment |
| `/my-orders` | Order history |
| `/wishlist` | Wishlist page |
| `/auth/signin` | Login |
| `/auth/signup` | Customer registration |
| `/auth/verify-email` | OTP email verification |
| `/auth/teacher-signup` | Teacher registration form |
| `/forgot-password` | Password reset flow |
| `/blogs` | Blog listing |
| `/blogs/[slug]` | Blog post detail |
| `/study-material` | Study material listing |
| `/study-material/[slug]` | Study material detail |
| `/teaching-resource` | Teaching resource listing |
| `/teaching-resource/[slug]` | Teaching resource detail |
| `/specimen` | Specimen book request form |
| `/bulk-order` | Bulk order inquiry form |
| `/contact-us` | Contact form |
| `/privacy-policy` | Privacy policy |
| `/terms-conditions` | Terms and conditions |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management + drag-and-drop reorder |
| `/admin/orders` | Order management |
| `/admin/categories` | Category management |
| `/admin/users` | User management |
| `/admin/teachers` | Teacher verification |
| `/admin/specimen-requests` | Specimen request management |
| `/admin/bulk-orders` | Bulk order management |
| `/admin/coupons` | Coupon management |
| `/admin/reviews` | Review moderation |
| `/admin/blogs` | Blog management |
| `/admin/banners` | Homepage banner management |
| `/admin/shipping-settings` | Delivery charge rules |
| `/admin/study-materials` | Study material management |
| `/admin/teaching-resources` | Teaching resource management |

---

## 9. Authentication Flow

1. **Signup**: `POST /api/auth/signup` → sends OTP to email via Brevo → user verifies OTP at `/auth/verify-email`
2. **Login**: `POST /api/auth/login` → returns JWT token
3. **Token storage**: `localStorage['cremson_token']`
4. **Axios interceptor**: auto-adds `Authorization: Bearer {token}` to all requests
5. **Session restore**: On app load, `AppContext` reads token from localStorage → calls `GET /api/auth/me` → syncs user state
6. **Admin check**: JWT payload contains `is_admin: true` flag

**Guest behaviour**: Guests can browse, search, add to cart (stored in localStorage). Must login to checkout.

---

## 10. Product System

### Product Types

| Type | Identifier |
|------|-----------|
| Normal book | Standard product |
| Combo / Bundle | `author: "Cremson Bundle"` OR `is_combo: true` OR tags contain "combo" OR `COMBO_IDS:[...]` in description |

### Discount Logic

Priority: **Product discount > Category discount > No discount**

```
Final Price = MRP × (1 - discount% / 100)
```

- `has_own_discount: true` + `own_discount_percentage > 0` → product-level discount
- `use_category_discount: true` → use category's configured discount
- Otherwise → price equals MRP

### Product Search

- Frontend sends `?search=<term>` to `GET /api/products/`
- Backend filters Baserow with `filter__name__contains=<term>`
- Results sorted by `display_order` ascending, then `-id`

### Product Display Order (Drag & Drop)

- Admin reorders products via drag-and-drop in `/admin/products`
- `POST /api/products/reorder` saves 1-indexed `display_order` for each product
- `display_order` stored in Baserow `Notes` field as `display_order: N`
- Unassigned products default to `display_order: 999999`
- Homepage bestsellers = top 8 by display_order

### Dimensions & Weight

Admin enters dimensions as 3 separate fields (L × W × H in cm). Stored as `"27cm x 19cm x 1cm"`. Parsed by `parse_dimension_cm()` in `shipway.py` for shipping calculations.

### mapProduct() — Frontend Normalisation

`lib/api/products.js` `mapProduct()` normalises raw Baserow rows:
- Calculates `price` from MRP and discount
- Parses `combo_product_ids` (JSON / CSV / embedded string)
- Parses `sub_categories` (JSON array or CSV string)
- Parses `classes` JSON array
- Determines `isCombo` from multiple signals
- Maps `stock_status` to UI-friendly values

---

## 11. Cart & Checkout Flow

### Cart

- **Guest**: cart stored in `localStorage`, synced to `AppContext`
- **Logged in**: backend is authoritative (`/api/cart/`)
- On login: guest cart is merged with backend cart

### Checkout Steps

1. User reviews cart → proceeds to `/checkout`
2. Selects or enters delivery address
3. Optionally applies coupon code
4. Shipping charge calculated based on `Shipping Settings` rules
5. Clicks "Pay" → Razorpay payment modal opens
6. On success → order created → WhatsApp + email notifications sent

---

## 12. Payment Flow (Razorpay)

```
Checkout Page
    │
    ├── POST /api/payment/create-order  ← Creates Razorpay order, returns order_id
    │
    ├── Razorpay JS modal opens (client-side)
    │       User completes payment
    │
    ├── POST /api/payment/verify        ← Verifies HMAC signature
    │       Creates order in DB
    │       Sends WhatsApp order_confirmation_v6
    │       Sends confirmation email
    │
    └── Redirect to /my-orders
```

**Refunds**: `POST /api/payment/refund` → Razorpay refund API → sends `refund_initiated_v1` WhatsApp message

---

## 13. Shipping Flow (Shipway)

### AWB Generation (Admin)

1. Admin opens order in `/admin/orders`
2. Clicks "Generate AWB"
3. Backend calls Shipway API with order details (dimensions, weight, address)
4. AWB number stored on order
5. WhatsApp `shipment_created_v1` sent to customer with tracking link

### Webhook Updates

Shipway sends delivery status webhooks to `POST /api/webhooks/shipway`:

| Shipway Event | WhatsApp Template Sent |
|---------------|----------------------|
| Dispatched / AWB created | `shipment_created_v1` |
| Out for Delivery | `out_for_delivery_v2` |
| Delivered | `delivered_v2` |
| Return to Origin (RTO) | `rto_v2` |

---

## 14. WhatsApp Integration

### Outbound Notifications

All outbound messages sent via Meta WhatsApp Cloud API using pre-approved templates.

#### OTP

| Template | Variables |
|----------|-----------|
| `cremson_otp` | `{{1}}` = 6-digit OTP |

#### Orders

| Template | Trigger | Variables |
|----------|---------|-----------|
| `order_confirmation_v6` | Successful payment | Name, Order ID, Transaction ID, Items list, Total |
| `payment_failed_v6` | Payment failure | Name, Amount, Order ID |
| `refund_initiated_v1` | Refund started | Name, Amount, Order ID, Refund Ref ID |
| `refund_completed_v1` | Refund credited | Name, Amount, Order ID, Refund Ref ID |

#### Shipping

| Template | Trigger | Variables |
|----------|---------|-----------|
| `shipment_created_v1` | AWB generated | Name, Order ID, AWB, Courier, Tracking URL |
| `out_for_delivery_v2` | Out for delivery | Name, Order ID, Tracking URL |
| `delivered_v2` | Delivered | Name, Order ID |
| `rto_v2` | Return to origin | Name, Order ID |

#### Teacher / CRM

| Template | Trigger | Variables |
|----------|---------|-----------|
| `teacher_signup_confirm` | New teacher registered | Name |
| `teacher_approved` | Admin approves teacher | Name, Sign-in URL |

#### Bulk Orders

| Template | Trigger | Variables |
|----------|---------|-----------|
| `bulk_order_requested_v1` | Bulk order submitted | Teacher Name, School Name, Order Link |
| `bulk_order_approved_v10` | Admin approves bulk order | Teacher Name, School Name, Final Amount, Payment URL |
| `bulk_order_shipped_v1` | Bulk order dispatched | Teacher Name, School Name, AWB, Tracking URL |

#### Specimen Requests

| Template | Trigger | Variables |
|----------|---------|-----------|
| `specimen_received_v3` | Specimen request submitted | Teacher Name, Books list |
| `specimen_rejected_v1` | Specimen request rejected | Teacher Name, Books description |
| `specimen_already_submitted_v1` | Duplicate request detected | Teacher Name, Book Title, Previous date |

#### Engagement

| Template | Trigger | Variables |
|----------|---------|-----------|
| `invoice_available_v1` | Invoice generated | Name, Order ID, Invoice URL |
| `support_request_v1` | Contact form submitted | Name, Subject, Ticket ID |
| `review_request_v1` | Post-delivery review ask | Name, Book Name, Review URL |
| `reorder_reminder_v1` | Reorder campaign | Name, Previous items, Catalog URL |

---

### WhatsApp Chatbot (Inbound)

Webhook receives messages at `POST /api/whatsapp/webhook`. State machine per user phone number.

#### Global Reset Triggers

Keywords: `hi`, `hello`, `start`, `menu`, `main` → resets to `MAIN_MENU` and sends Welcome Menu.

#### Welcome Menu

```
1️⃣ Teachers Section
2️⃣ Buy Books
3️⃣ Track Your Order
4️⃣ Request Specimen Copy
5️⃣ Bulk Order Inquiry
6️⃣ Contact Support
```

#### Global Keyword Routes (active in all states)

| Keyword Regex | Action |
|--------------|--------|
| `yes\|order\|bulk order\|interested\|...` | Bulk order inquiry with website + form links |
| `feedback\|review\|thoughts\|suggestion\|...` | Request written feedback on specimen |
| `received\|got it\|delivered\|books arrived\|...` | Delivery confirmation + feedback prompt |

#### State Machine Flows

**WAITING_TEACHER_PROMPT** (Options 1 or 4)
- A / Registered → looks up phone in Teachers table (877)
  - Not found → redirect to register
  - Pending → verification pending message
  - Active/Verified → share Google Drive + specimen request link
- B / Unregistered → share teacher signup link

**Teacher Chat Registration** (multi-step)
- `TEACHER_REG_NAME` → collect name
- `TEACHER_REG_SCHOOL` → collect school + city
- `TEACHER_REG_SUBJECT` → collect subjects and classes
- `TEACHER_REG_DOC` → request photo of school ID card
- Complete → submit to Baserow + notify admin

**Package Tracking** (Option 3)
- Auto-searches Orders (762) + Specimen Requests (878) by phone
- 0 results → asks for Order ID / Specimen ID (state: `WAITING_FOR_ORDER_ID`)
- 1 result → shows tracking details directly
- Multiple results → lists up to 5 (state: `WAITING_FOR_ORDER_SELECTION`)

---

## 15. Email Integration (Brevo)

Brevo SMTP used for transactional emails via `services/email.py`:

| Trigger | Email Sent |
|---------|-----------|
| Signup | OTP verification email |
| Order placed | Order confirmation email |
| Password reset | Reset link email |
| Specimen request | Confirmation to teacher |

---

## 16. Specimen Request Flow

1. Teacher visits `/specimen` and fills request form
2. `POST /api/specimen-requests/` → saves to Baserow (table 878)
3. WhatsApp `specimen_received_v3` sent to teacher
4. Admin reviews at `/admin/specimen-requests`
5. Admin approves → status updated → books dispatched via Shipway
6. Admin rejects → `specimen_rejected_v1` sent to teacher
7. Duplicate detection → `specimen_already_submitted_v1` sent

---

## 17. Bulk Order Flow

1. Teacher/school submits bulk order at `/bulk-order`
2. `POST /api/bulk-orders/` → saves to Baserow
3. WhatsApp notification sent to teacher + admin alert
4. Admin reviews at `/admin/bulk-orders`
5. Admin applies special discount + approves
6. `bulk_order_approved_v10` sent with payment link
7. Teacher pays → payment confirmed → `bulk_order_shipped_v1` on dispatch

---

## 18. Admin Dashboard

All admin pages under `/admin/`. Access restricted to users with `is_admin: true` in JWT.

| Page | Description |
|------|-------------|
| `/admin` | Stats: orders, revenue, users, products |
| `/admin/products` | CRUD + drag-and-drop reorder + toggle active/inactive |
| `/admin/orders` | View/update orders, generate AWB via Shipway |
| `/admin/categories` | Category CRUD with discount settings |
| `/admin/users` | User listing and management |
| `/admin/teachers` | Teacher profile review, approve/reject |
| `/admin/specimen-requests` | Review and process specimen requests |
| `/admin/bulk-orders` | Manage bulk institutional orders + discounts |
| `/admin/coupons` | Create and manage coupon codes |
| `/admin/reviews` | Moderate product reviews |
| `/admin/blogs` | Blog post editor (BlockNote WYSIWYG) |
| `/admin/banners` | Homepage carousel banner management |
| `/admin/shipping-settings` | Configure delivery charge rules |
| `/admin/study-materials` | Study material category + posts |
| `/admin/teaching-resources` | Teaching resource category + posts |

---

## 19. Image Storage (Cloudinary)

- **Cloud name**: `dkxxa3xt0`
- Product images uploaded directly from admin via Cloudinary unsigned upload
- Stored as HTTPS URLs in Baserow product rows (`main_image`, `side_images`)
- Admin can delete remote images via `POST /api/admin/cloudinary/delete` (passes `public_id`)

---

## 20. Deployment

### CI/CD — GitHub Actions

File: `.github/workflows/deploy.yml`

Triggered automatically on **any tag push** (e.g. `v2.6.62`).

**Steps:**
1. SSH into production server (`SERVER_IP`, `SERVER_USER`, `SERVER_PASSWORD` from GitHub Secrets)
2. `cd /opt/cremson-baserow`
3. `git fetch --tags && git checkout -f <tag> && git reset --hard <tag>`
4. Install Python dependencies inside `venv`
5. `sudo systemctl restart cremson-backend`

### Tagging & Releasing

```bash
# Commit your changes
git add <files>
git commit -m "feat: your change"

# Create tag (next after latest)
git tag v2.6.62

# Push commit + tag (triggers auto-deploy)
git push origin main
git push origin v2.6.62
```

### Production Server

| Component | Location |
|-----------|----------|
| Backend | `/opt/cremson-baserow/cremson-backend/` |
| Service | `systemctl cremson-backend` |
| Backend URL | `http://200.141.5.200:8000` |
| Frontend | Deployed separately (Cloudflare Workers / static) |

### Frontend Build

```bash
cd cremson-next-ui
npm run build
```

Uses `.env.production` which points `NEXT_PUBLIC_API_URL` at the production server.

---

## Key Development Notes

- **Baserow filter field names are case-sensitive** — use exact column names (e.g. `name` not `Name`)
- **Product name field**: `name` (lowercase) in Baserow table 763
- **All routes prefix `/api/`** — e.g. `/api/products/`, `/api/orders/`
- **Backend always fetches 200 rows max** from Baserow per request, then applies post-filters in Python
- **Inactive products** filtered out via `is_active=true` sent by frontend on all product fetches
- **Combo detection**: checks `is_combo` field, `author == "Cremson Bundle"`, tags contain "combo", or `COMBO_IDS:[...]` embedded in description/tags
