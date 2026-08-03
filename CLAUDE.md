# Cremson Publications - Project Overview for Claude

## What This Project Is

**Cremson Publications** is a full-stack e-commerce platform for selling educational books and textbooks. It has two major parts:

- `cremson-backend/` — FastAPI (Python) REST API
- `cremson-next-ui/` — Next.js 16 frontend (React 19, App Router)

Primary database: **Baserow** (open-source headless DB running at `http://200.141.5.200`). Supabase is configured via MCP but not actively used for core operations.

---

## How to Run

### Automated (recommended):
```bash
./start.sh
```
Handles venv, pip install, npm install, starts both servers, waits for backend health check.

### Manual:
```bash
# Backend (port 8000)
cd cremson-backend && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend (port 3000)
cd cremson-next-ui && npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

---

## Project Structure

```
Cremson-Baserow/
├── start.sh                    # Starts both servers
├── .mcp.json                   # Supabase MCP config (project: vayisutwehvbjpkhzhcc)
├── cremson-backend/
│   ├── main.py                 # FastAPI app entry, all 27 routers registered
│   ├── config.py               # Env loading + TABLE_IDS (Baserow table ID map)
│   ├── requirements.txt
│   ├── .env                    # All secrets (Baserow, JWT, SMTP, Razorpay, WhatsApp, Shipway, Cloudinary)
│   ├── routers/                # 27 API route modules
│   ├── services/
│   │   ├── baserow.py          # Baserow API client (get/create/update/delete rows)
│   │   ├── email.py            # Brevo SMTP email sender
│   │   ├── razorpay.py         # Payment processing
│   │   ├── shipway.py          # Shipping integration
│   │   └── whatsapp.py         # WhatsApp template messages
│   ├── db/                     # Baserow query helpers per domain
│   ├── schemas/                # Pydantic models
│   └── utils/
└── cremson-next-ui/
    ├── app/                    # Next.js App Router pages
    │   ├── layout.js           # Root layout + providers
    │   ├── page.js             # Home (carousel + bestsellers)
    │   ├── shop/               # Product listing + detail
    │   ├── cart/, checkout/    # Cart and payment flow
    │   ├── auth/               # signin, signup, verify-email, teacher-signup
    │   ├── my-orders/          # Order history
    │   ├── blogs/              # Blog listing + detail
    │   ├── specimen/           # Specimen book requests
    │   └── admin/              # 20+ admin dashboard pages
    ├── components/             # 9 reusable components (Header, Footer, CartDrawer, WishlistDrawer, MobileMenuDrawer, etc.)
    ├── context/
    │   └── AppContext.js       # Global state: cart, wishlist, user, authToken, searchQuery
    ├── lib/
    │   ├── api/                # axios.js (client with interceptors) + per-domain API files
    │   └── providers/          # QueryProvider.jsx (TanStack React Query)
    ├── data/books.js           # Static banner slides and default product data
    ├── .env.local              # NEXT_PUBLIC_API_URL=http://localhost:8000
    ├── .env.production         # NEXT_PUBLIC_API_URL=http://200.141.5.200:8000
    └── next.config.mjs
```

---

## Baserow Table IDs

Defined in `cremson-backend/config.py` as `TABLE_IDS`:

| Table | ID |
|-------|----|
| Users (Auth) | 761 |
| Orders | 762 |
| Products | 763 |
| Categories | 764 |
| Reviews | 765 |
| Coupons | 766 |
| Shipping Settings | 768 |
| Auth Users | 769 |
| Email OTPs | 770 |
| User Addresses | 771 |
| Cart Items | 772 |
| Wishlist Items | 773 |
| Shipment History | 774 |
| School | 876 |
| Teacher | 877 |
| Specimen Requests | 878 |
| Books | 879 |
| Subject | 880 |

---

## Key Patterns to Know

### Authentication
- JWT tokens, stored in `localStorage['cremson_token']`
- Axios interceptor in `lib/api/axios.js` auto-adds `Authorization: Bearer {token}`
- Guests can browse/cart, must auth to checkout
- Admin credentials: email=`cremsonpublications@gmail.com`, password=`12345678` (hardcoded)
- Admin token carries `is_admin: true` flag

### State Management (`AppContext.js`)
- Single source of truth for cart, wishlist, user, authToken, searchQuery
- On load: checks localStorage for token → fetches `/api/auth/me` → syncs cart/wishlist from backend
- Guest: cart/wishlist in localStorage. Authenticated: backend is authoritative
- `useApp()` hook provides all state and actions

### Product Data Flow
- Baserow stores raw fields (mrp, discount %, combo_ids as JSON/CSV/embedded string)
- `lib/api/products.js` → `mapProduct()` normalizes to typed object: calculates final price, parses combo IDs, fills defaults
- `fetchAllProducts()` auto-paginates (200/page) and caches in `AppContext.allProducts`

### Discount Logic
Product discount > Category discount > No discount. Final price = MRP × (1 - discount%/100)

### Combo Products
Products can bundle others. Combo IDs stored in 3 formats (JSON, CSV, embedded string). `mapProduct()` handles all formats. Marked by `is_combo: true`, `author: "Cremson Bundle"`, or `tags` containing "combo".

### API Error Handling
Axios response interceptor: parses Pydantic v2 validation errors, shows Sonner toast for success (mutations) and errors. Backend returns user-friendly error messages.

### Backend Route Convention
All routes prefixed `/api/`. Example: `/api/products/`, `/api/orders/`, `/api/auth/`, `/api/payment/`.

### File Storage
Images via Cloudinary (`cloud_name: dkxxa3xt0`). Admin deletes via `/api/admin/cloudinary/delete`.

### Notifications
- WhatsApp order notifications via Meta API (template: `order_confirmation_v5`)
- Email via Brevo SMTP

---

## External Services & Credentials (from `.env`)

| Service | Purpose |
|---------|---------|
| Baserow at `http://200.141.5.200` | Primary database |
| Razorpay (`rzp_test_*`) | Payment processing (test keys) |
| Brevo SMTP | Transactional email |
| Meta WhatsApp API | Order notifications |
| Shipway | Shipping/tracking |
| Cloudinary (`dkxxa3xt0`) | Image storage |

---

## Tech Stack Summary

**Backend:** Python, FastAPI, uvicorn, httpx, passlib (bcrypt), python-jose (JWT), aiosmtplib

**Frontend:** Next.js 16.2.12, React 19, TailwindCSS 4, Mantine UI, TanStack React Query, Axios, Lucide React, Sonner (toasts), BlockNote (WYSIWYG editor), Recharts, Marked (markdown)

**Infra:** Baserow (self-hosted DB), Cloudflare Workers (`wrangler.jsonc` in next-ui), Supabase (configured, not core)

---

## Currently Modified Files (as of last session)

- `cremson-next-ui/app/layout.js`
- `cremson-next-ui/app/shop/page.js`
- `cremson-next-ui/app/wishlist/page.js`
- `cremson-next-ui/components/Header.js`

Recent work has been on mobile UI: search bar, drawer width/animations, hamburger menu, mobile product card layout, discount badge display.
