# Cremson Next.js UI

A modern e-commerce storefront for Cremson Publications, built using Next.js (App Router) and Styled/Vanilla CSS. It features a complete catalog, cart management, checkout with Razorpay SDK integration, and customer order history.

---

## 🛠️ Tech Stack & Structure
- **Framework**: Next.js 14+ (App Router)
- **State Management**: AppContext (`context/AppContext.js`) for cart, authentication state, and user settings.
- **Styling**: Vanilla CSS & custom components.
- **Payment integration**: Razorpay Checkout SDK.

---

## 🚀 Setup & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Create a `.env.local` file in the root of `cremson-next-ui/` containing:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the storefront.

---

## 🛒 Checkout & Payment Flow

1. **Cart Submission**:
   - The user selects books and clicks "Checkout" in `/cart`.
   - The app navigates to `/checkout` where shipping/billing addresses are filled out or selected.

2. **Order Creation Request**:
   - The frontend triggers `POST /api/payment/create-order` on the FastAPI backend, passing the cart items and total price.
   - The backend responds with a Razorpay `order_id` (e.g., `order_LkuY...`).

3. **Razorpay Modal Trigger**:
   - The frontend loads the Razorpay checkout script and opens the payment overlay.
   - The user enters payment credentials (test credentials if in Razorpay Test Mode).

4. **Payment Verification**:
   - If successful, Razorpay returns `razorpay_payment_id` and `razorpay_signature`.
   - The frontend sends these details to the backend via `POST /api/payment/verify`.
   - On success, the local cart is cleared, and the user is redirected to `/checkout/success` or `/my-orders`.
   - If failed or cancelled, the user is shown an error message and can try paying again.

---

## 📂 Core Folder Structure
- **`app/`**: Pages and routers:
  - `/checkout`: Checkout page with Razorpay loader.
  - `/my-orders`: Orders list fetching history from the backend.
  - `/auth`: Sign up and log in page components.
- **`context/`**: Contains `AppContext.js` managing cart actions and active user state.
- **`components/`**: Custom interactive UI elements.
