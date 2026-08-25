# 📲 Cremson Publications — Official WhatsApp Message Templates

This document contains all Meta-approved WhatsApp Cloud API message templates integrated into the Cremson Publications system for **OTP**, **Orders**, **Payments**, **Delivery Tracking**, **Bulk Orders**, and **Specimen Requests**.

---

## 🔑 1. OTP Verification Template

### **Template Name**: `cremson_otp`
- **Category**: `AUTHENTICATION`
- **Language**: English (`en`)
- **Buttons**: Quick Copy Button (`COPY_CODE`)

#### **Message Content**:
> `{{1}}` is your verification code for Cremson Publications. For security reasons, do not share this code with anyone.
>
> *(Button: Copy Code `{{1}}`)*

- **Variables**:
  - `{{1}}` = 6-digit OTP Code (e.g. `482091`)

---

## 🛒 2. Order Confirmation Template

### **Template Name**: `order_confirmation_v6`
- **Category**: `UTILITY`
- **Language**: English (`en`)

#### **Message Content**:
> Hello `{{1}}`,
>
> Thank you for ordering from Cremson Publications! Your order `{{2}}` has been successfully placed.
>
> 💳 **Transaction ID**: `{{3}}`
> 📦 **Items Ordered**:
> `{{4}}`
>
> 💰 **Total Paid**: `{{5}}`
>
> We are preparing your order for shipping and will update you with tracking details as soon as it dispatches!
>
> Best regards,
> **Cremson Publications Team**

- **Variables**:
  - `{{1}}` = Customer Name (e.g. `Rahul Sharma`)
  - `{{2}}` = Order ID (e.g. `ORD-84019`)
  - `{{3}}` = Payment Transaction ID / Payment ID (e.g. `pay_Pz92kL10s`)
  - `{{4}}` = Itemised Books List (e.g. `• Psychology Made Easy XI (1 x ₹308.00) = ₹308.00`)
  - `{{5}}` = Total Order Amount (e.g. `₹308.00`)

---

## 💳 3. Payment Failed Template

### **Template Name**: `payment_failed_v6`
- **Category**: `UTILITY`
- **Language**: English (`en`)

#### **Message Content**:
> Hello `{{1}}`,
>
> We noticed that your payment of `{{2}}` for Order ID `{{3}}` was unsuccessful.
>
> Don't worry! Your items are still saved in your cart. You can retry the payment by clicking the link below or visiting your cart.
>
> If money was debited from your account, it will be automatically refunded by your bank within 3-5 business days.
>
> Best regards,
> **Cremson Publications Team**

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order Amount (e.g. `₹450.00`)
  - `{{3}}` = Order ID

---

## 🚚 4. Shipping & Delivery Tracking Templates

### A. Shipment Dispatched / AWB Generated
- **Template Name**: `shipment_created_v1`
- **Category**: `UTILITY`

#### **Message Content**:
> Hello `{{1}}`,
>
> Great news! Your order `{{2}}` has been packed and dispatched via `{{4}}`.
>
> 📦 **AWB Tracking Number**: `{{3}}`
> 🔗 **Track your parcel live**: `{{5}}`
>
> Thank you for shopping with Cremson Publications!

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID
  - `{{3}}` = Courier AWB Number (e.g. `1430982140`)
  - `{{4}}` = Courier Partner Name (e.g. `Bluedart / Delhivery / Shipway`)
  - `{{5}}` = Live Tracking Link URL

---

### B. Shipment Picked Up (In Transit)
- **Template Name**: `picked_up_v1` (and `in_transit_v1`)
- **Category**: `UTILITY`

#### **Message Content**:
> Hello `{{1}}`,
>
> Your parcel for Order `{{2}}` has been picked up by the courier partner and is currently in transit.
>
> 🔗 **Track Status**: `{{3}}`
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID
  - `{{3}}` = Live Tracking Link URL

---

### C. Out for Delivery
- **Template Name**: `out_for_delivery_v2`
- **Category**: `UTILITY`

#### **Message Content**:
> Hello `{{1}}`,
>
> Your package for Order `{{2}}` is **out for delivery** today! Please ensure someone is available at your delivery address to receive it.
>
> 🔗 **Track Delivery Agent**: `{{3}}`
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID
  - `{{3}}` = Live Tracking Link URL

---

### D. Order Delivered
- **Template Name**: `delivered_v2`
- **Category**: `UTILITY`

#### **Message Content**:
> Hello `{{1}}`,
>
> Your order `{{2}}` has been **successfully delivered**! 🎉
>
> We hope you enjoy reading your new books. If you have a moment, please leave us a review on our website.
>
> Thank you for choosing Cremson Publications!

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID

---

### E. Return to Origin (Undelivered / RTO)
- **Template Name**: `rto_v2`
- **Category**: `UTILITY`

#### **Message Content**:
> Hello `{{1}}`,
>
> Delivery was attempted for Order `{{2}}` but could not be completed. The parcel is being returned to our warehouse.
>
> Please contact our support team if you need assistance or re-shipment.
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID

---

## 🏫 5. Bulk Order Templates (Schools / Teachers)

### A. Bulk Order Request Received
- **Template Name**: `bulk_order_requested_v1`

#### **Message Content**:
> Hello `{{1}}`,
>
> We have received your bulk order request for `{{2}}`. Our team is reviewing the request and will apply special bulk institution pricing shortly.
>
> 🔗 **View request status**: `{{3}}`
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Teacher / Contact Name
  - `{{2}}` = Institution / School Name
  - `{{3}}` = Bulk Order Link URL

---

### B. Bulk Order Approved & Discounted
- **Template Name**: `bulk_order_approved_v10`

#### **Message Content**:
> Hello `{{1}}`,
>
> Good news! Your bulk order request for `{{2}}` has been approved with special institutional pricing.
>
> 💰 **Final Amount Payable**: `₹{{3}}`
> 🔗 **Complete Payment Here**: `{{4}}`
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = School Name
  - `{{3}}` = Final Discounted Payable Amount
  - `{{4}}` = Payment Page URL

---

### C. Bulk Order Shipment Dispatched
- **Template Name**: `bulk_order_shipped_v1`

#### **Message Content**:
> Hello `{{1}}`,
>
> The bulk shipment for `{{2}}` has been dispatched!
>
> 📦 **AWB Number**: `{{3}}`
> 🔗 **Track Shipment**: `{{4}}`
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = School Name
  - `{{3}}` = AWB Tracking Number
  - `{{4}}` = Live Tracking Link URL

---

## 📖 6. Specimen Book Request Templates

### A. Specimen Request Received
- **Template Name**: `specimen_received_v1`

#### **Message Content**:
> Hello `{{1}}`,
>
> Thank you for requesting specimen copies (`{{2}}` book(s)) from Cremson Publications. Our team is verifying your school details and will dispatch your copies soon.
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = Number of Books Requested

---

### B. Specimen Request Rejected
- **Template Name**: `specimen_rejected_v1`

#### **Message Content**:
> Hello `{{1}}`,
>
> Thank you for your interest in Cremson Publications.
>
> Regarding your specimen request (`{{2}}`), we were unable to approve the request at this time. If you have questions, please reach out to our support team.
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = Books Requested Description
