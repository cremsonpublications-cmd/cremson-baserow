# Cremson Publications - Full Product & Architecture Documentation

A full-stack e-commerce platform built for selling educational books and textbooks with custom product positioning, bundle management, automated shipping integration, and headless database architecture.

---

## 🏗️ System Architecture & Technology Stack

- **Frontend**: Next.js 16 (App Router, React 19, Tailwind CSS, TanStack React Query, Lucide Icons, Sonner Toasts)
- **Backend**: FastAPI (Python 3.10+), Uvicorn, Pydantic, HTTPX
- **Headless Database**: Baserow Engine (`http://200.141.5.200`)
- **Integrations**:
  - **Shipway API**: Automated shipping calculation, airway bill generation, and courier tracking.
  - **Razorpay**: Online payment gateway integration.
  - **Cloudinary**: Direct client-side unsigned image uploads & remote asset management.
  - **Brevo (Sendinblue)**: Transactional SMTP emails and OTP verification.
  - **WhatsApp Business API**: Automated order notifications & updates.

---

## ⚡ Quick Start (Running Locally)

### Automatic Launch (Recommended)
Run the automated startup script from the project root:
```bash
./start.sh
```
This script automatically:
1. Checks and initializes Python virtual environment (`venv`).
2. Installs required Python dependencies from `cremson-backend/requirements.txt`.
3. Installs Node.js dependencies in `cremson-next-ui/`.
4. Starts FastAPI backend on port `8000` and Next.js frontend on port `3000`.
5. Performs a health check at `http://localhost:8000/docs`.

### Manual Launch

**1. Backend (FastAPI)**:
```bash
cd cremson-backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Base URL: `http://localhost:8000`
- Swagger Interactive Docs: `http://localhost:8000/docs`

**2. Frontend (Next.js)**:
```bash
cd cremson-next-ui
npm run dev
```
- Web Application URL: `http://localhost:3000`
- Admin Dashboard URL: `http://localhost:3000/admin`

---

## 📚 Core Features & How They Work

### 1. Product Position & Drag-and-Drop Reordering

#### Admin Product Reordering (`http://localhost:3000/admin/products`)
- **Handle-Activated Dragging**: Dragging is enabled strictly when grabbing the `<GripVertical>` handle (`onMouseDown`/`onTouchStart`). Clicking or selecting text inside product rows does not trigger accidental dragging.
- **Real-time Live Row Swapping**: Dragging a book over target rows updates row positions live on the UI with smooth animations (`scale-[0.99]`, dashed borders, purple accent tint).
- **Auto-Save on Release (`handleDragEnd`)**:
  - Releasing the mouse (drop/dragEnd) automatically computes the 1-indexed `display_order` positions and invokes `POST /api/products/reorder`.
  - Displays a clean loading toast with a black spinner icon (`Saving new product order...`), transitioning smoothly to `"Product order updated successfully"`.

#### Backend Position Storage
- Baserow API tokens use key-value serialization inside the `Notes` column (`Notes: "display_order: N"`).
- Backend `map_product_out` parses `display_order` (defaulting unassigned products to `999999`).
- Default backend sorting: `(x.get("display_order", 999999), -x.get("id", 0))`.

#### Customer-Facing Display Consistency
- **Home Page (`http://localhost:3000/`)**:
  - The **Best Selling Books** section takes `books.slice(0, 8)`, displaying the top 8 books strictly in your custom drag-and-drop order (`#1` through `#8`).
- **Shop Page (`http://localhost:3000/shop`)**:
  - Displays all books according to custom `display_order`.
  - When filters (Class, Category, Subcategory, Stock, Search) are applied, books retain their relative custom position order.

---

### 2. Dimensions & Weight System (Shipway Integration)

#### 3 UI Input Boxes for Dimensions
In the Admin Product Modal (`ProductModal`), dimensions are entered using **3 separate UI input boxes**:
- **Length (L)**: e.g. `27`
- **Width (W)**: e.g. `19`
- **Height (H)**: e.g. `1`

#### Standardized Format & Automatic Joining
- Formats input into standard dimension string: `"27cm x 19cm x 1cm"`.
- When editing a product, `parseDimension()` automatically splits existing strings (e.g. `"27cm 19cm 1cm"` or `"27 x 19 x 1"`) into the 3 input fields.

#### Shipway Logistics Integration
- When an order is created, `parse_dimension_cm(dim_str)` in `cremson-backend/services/shipway.py` parses `"27cm x 19cm x 1cm"` into:
  - `length` = `27.0`
  - `breadth` (width) = `19.0`
  - `height` = `1.0`
- Sends exact dimensions and weights to Shipway API for accurate shipping rate calculation and label generation.

---

### 3. Product Types & Catalog Management

- **Normal Products**: Individual textbooks/lab manuals with specific author, ISBN, edition, MRP, discount options, weight, and 3-box dimensions.
- **Combo / Bundle Packs**: Multi-book packages (`author: "Cremson Bundle"`) containing multiple product IDs, custom pricing, and automated inventory sync.
- **Discounts**: Flexible discount rules (No Discount, Category Discount, or Custom Percentage/Flat Discount).
- **Bulk Pricing Tiers**: Tiered volume discounts (e.g., Buy 10+ for ₹250 each).

---

## 🗄️ Database Tables (Baserow Table IDs)

Defined in `cremson-backend/config.py`:

| Table Name | Baserow ID | Description |
|------------|------------|-------------|
| Users (Auth) | 761 | Customer login details, roles, profiles |
| Orders | 762 | Customer orders, payment status, Shipway tracking |
| Products | 763 | Books, combo bundles, display_order, dimensions |
| Categories | 764 | Book categories & subcategories |
| Reviews | 765 | Product ratings and reviews |
| Coupons | 766 | Discount code rules |
| Shipping Settings | 768 | Delivery charges & pincode rules |
| Email OTPs | 770 | Login & signup verification codes |

---

## 📡 Key API Endpoints

### Products (`/api/products`)
- `GET /api/products/`: List all products (sorted by `display_order`, `-id`).
- `POST /api/products/reorder`: Bulk update display positions `{"orders": [{"id": 28, "display_order": 1}, ...]}`.
- `POST /api/products/`: Create new product/bundle.
- `PUT /api/products/{id}`: Update product details.
- `DELETE /api/products/{id}`: Soft/Hard delete product.

### Admin (`/api/admin`)
- `POST /api/admin/cloudinary/delete`: Remote image cleanup.
- `GET /api/admin/stats`: Dashboard analytical statistics.

---

## 🛡️ Project Directory Structure

```
Cremson-Baserow/
├── README.md                   # Full product & architecture documentation
├── start.sh                    # Automated dual-server startup script
├── cremson-backend/            # Python FastAPI Backend
│   ├── main.py                 # Application entry point & router registration
│   ├── config.py               # Env variables & Baserow Table ID mapping
│   ├── routers/                # API router modules (products, orders, auth, etc.)
│   └── services/               # Baserow, Shipway, Razorpay, Brevo, WhatsApp clients
└── cremson-next-ui/            # Next.js App Router Frontend
    ├── app/
    │   ├── page.js             # Homepage (Carousel + Top 8 Best Sellers)
    │   ├── shop/               # Shop page with custom position retention
    │   └── admin/products/     # Admin Product Table with drag & drop + 3-box dimensions
    ├── lib/api/                # API helpers (admin.js, products.js, axios.js)
    └── components/             # Reusable UI components
```
