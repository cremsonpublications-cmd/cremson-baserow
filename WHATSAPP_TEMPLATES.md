# 📲 Cremson Publications — Official WhatsApp Message Templates

This document contains all Meta-approved WhatsApp Cloud API message templates integrated into the Cremson Publications system for **OTP**, **Orders**, **Payments**, **Delivery Tracking**, **Bulk Orders**, and **Specimen Requests**.

---

## 🔑 1. OTP Verification Template

### **Template Name**: `cremson_otp`
- **Category**: `AUTHENTICATION`
- **Language**: English (`en`)
- **Status**: `KEEP — NO CHANGE`
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
- **Status**: `KEEP — NO CHANGE`

#### **Message Content**:
> Hello `{{1}}`,
>
> Thank you for ordering from Cremson Publications! Your order `{{2}}` has been successfully placed.
>
> Transaction ID: `{{3}}`
> Items Ordered: `{{4}}`
> Total Paid: `{{5}}`
>
> We are preparing your order for shipping and will update you with tracking details as soon as it dispatches!
>
> Best regards, Cremson Publications Team

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
- **Status**: `UPDATED`
- **Buttons**: Dynamic URL CTA Button (`Retry Payment`)

#### **Message Content**:
> Hello `{{1}}`,
>
> We noticed that your payment of `{{2}}` for Order ID `{{3}}` was unsuccessful.
>
> Don't worry! Your items are still saved in your cart. You can retry the payment by clicking the link below or visiting your cart.
>
> If the amount was deducted from your account, please check with your bank or contact our support team with the payment reference.
>
> Best regards, Cremson Publications Team
>
> *(Button: Retry Payment)*

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order Amount (e.g. `₹450.00`)
  - `{{3}}` = Order ID
- **Button Parameter**: Cart / Retry Payment URL

---

### B. Refund Initiated
- **Template Name**: `refund_initiated_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `NEWLY CREATED`

#### **Message Content**:
> Hello `{{1}}`,
>
> Your refund of `{{2}}` for Order `{{3}}` has been initiated successfully.
>
> Refund Reference ID: `{{4}}`
>
> It usually takes 3-5 business days for the amount to reflect in your original payment source.
>
> Thank you for your patience!  
> **Cremson Publications Team**

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Refund Amount (e.g. `₹450.00`)
  - `{{3}}` = Order ID (e.g. `ORD-84019`)
  - `{{4}}` = Refund Reference / Transaction ID (e.g. `rfnd_Pz92kL10s`)

---

### C. Refund Completed
- **Template Name**: `refund_completed_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `NEWLY CREATED`

#### **Message Content**:
> Hello `{{1}}`,
>
> Great news! Your refund of `{{2}}` for Order `{{3}}` has been successfully processed and credited to your original payment source.
>
> Refund Reference ID: `{{4}}`
>
> Thank you for choosing Cremson Publications!  
> **Cremson Publications Team**

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Refund Amount (e.g. `₹450.00`)
  - `{{3}}` = Order ID (e.g. `ORD-84019`)
  - `{{4}}` = Refund Reference / Transaction ID (e.g. `rfnd_Pz92kL10s`)

---

## 🚚 4. Shipping & Delivery Tracking Templates

### A. Shipment Dispatched / AWB Generated
- **Template Name**: `shipment_created_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `UPDATED`
- **Buttons**: Dynamic URL CTA Button (`Track your Order`)

#### **Message Content**:
> Hello `{{1}}`,
>
> Great news! Your order `{{2}}` has been packed and dispatched via `{{4}}`.
>
> AWB Tracking Number: `{{3}}`
> Track your parcel live: `{{5}}`
>
> Thank you for shopping with Cremson Publications!
>
> *(Button: Track your Order)*

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID
  - `{{3}}` = Courier AWB Number (e.g. `1430982140`)
  - `{{4}}` = Courier Partner Name (e.g. `Bluedart / Delhivery / Shipway`)
  - `{{5}}` = Live Tracking Link URL
- **Button Parameter**: Live Tracking URL (`{{5}}`)

---

### B. Out for Delivery
- **Template Name**: `out_for_delivery_v2`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `KEEP — NO CHANGE`

#### **Message Content**:
> Hello `{{1}}`,
>
> Your package for Order `{{2}}` is out for delivery today! Please ensure someone is available at your delivery address to receive it.
>
> Track Delivery Agent: `{{3}}`
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID
  - `{{3}}` = Live Tracking Link URL

---

### C. Order Delivered
- **Template Name**: `delivered_v2`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `KEEP — NO CHANGE`

#### **Message Content**:
> Hello `{{1}}`,
>
> Your order `{{2}}` has been successfully delivered!
>
> We hope you enjoy reading your new books. If you have a moment, please leave us a review on our website.
>
> Thank you for choosing Cremson Publications!

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID

---

### D. Return to Origin (Undelivered / RTO)
- **Template Name**: `rto_v2`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `KEEP — NO CHANGE`

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
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `UPDATED`

#### **Message Content**:
> Hello `{{1}}`,
>
> We have received your bulk order request for `{{2}}`. Our team is reviewing the request and will apply special bulk institution pricing shortly.
>
> View request status: `{{3}}`
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Teacher / Contact Name
  - `{{2}}` = Institution / School Name
  - `{{3}}` = Bulk Order Link URL

---

### B. Bulk Order Approved & Discounted
- **Template Name**: `bulk_order_approved_v10`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `UPDATED`
- **Buttons**: Dynamic URL CTA Button (`Make Payment`)

#### **Message Content**:
> Hello `{{1}}`,
>
> Good news! Your bulk order request for `{{2}}` has been approved with special discounted pricing.
>
> Final Amount Payable: `{{3}}`
>
> Complete Payment Here: `{{4}}`
>
> Cremson Publications
>
> *(Button: Make Payment)*

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = School Name
  - `{{3}}` = Final Discounted Payable Amount
  - `{{4}}` = Payment Page URL
- **Button Parameter**: Payment Page URL (`{{4}}`)

---

### C. Bulk Order Shipment Dispatched
- **Template Name**: `bulk_order_shipped_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `UPDATED`
- **Buttons**: Dynamic URL CTA Button (`Track Shipment`)

#### **Message Content**:
> Hello `{{1}}`,
>
> The bulk shipment for `{{2}}` has been dispatched!
>
> AWB Number: `{{3}}`
> Track Shipment: `{{4}}`
>
> Cremson Publications
>
> *(Button: Track Shipment)*

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = School Name
  - `{{3}}` = AWB Tracking Number
  - `{{4}}` = Live Tracking Link URL
- **Button Parameter**: Live Tracking URL (`{{4}}`)

---

## 📖 6. Specimen Book Request Templates

### A. Specimen Request Received
- **Template Name**: `specimen_received_v1`
- **Status**: `KEEP — NO CHANGE`

#### **Message Content**:
> Hello `{{1}}`,
>
> Thank you for requesting specimen copies (`{{2}}`) from Cremson Publications. Our team is verifying your school details and will dispatch your copies soon.
>
> Cremson Publications

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = List of Books Requested

---

### B. Specimen Request Rejected
- **Template Name**: `specimen_rejected_v1`
- **Status**: `KEEP — NO CHANGE`

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

---

## 📄 7. Tax Invoice Available Template

### **Template Name**: `invoice_available_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `NEWLY CREATED`
- **Buttons**: Dynamic URL CTA Button (`Download Invoice`)

#### **Message Content**:
> Hello `{{1}}`,
>
> Great news! Your tax invoice for Order `{{2}}` is now available for download.
>
> View and download your official invoice PDF here: `{{3}}`
>
> Thank you for choosing Cremson Publications!  
> **Cremson Publications Team**
>
> *(Button: Download Invoice)*

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Order ID (e.g. `ORD-84019`)
  - `{{3}}` = Invoice Download URL (e.g. `https://cremsonpublications.com/uploads/invoices/ORD-84019_invoice.pdf`)
- **Button Parameter**: Invoice PDF Download Link (`{{3}}`)

---

## 🎧 8. Support Request Received Template

### **Template Name**: `support_request_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `NEWLY CREATED`
- **Buttons**: None

#### **Message Content**:
> Hello `{{1}}`,
>
> We have received your support request regarding "`{{2}}`". Our team is reviewing your message (Ticket ID: `{{3}}`) and will get back to you shortly.
>
> Thank you for contacting Cremson Publications!  
> **Cremson Publications Team**

- **Variables**:
  - `{{1}}` = Customer Name
  - `{{2}}` = Subject / Inquiry Type (e.g. `Contact Us Enquiry`)
  - `{{3}}` = Ticket ID (e.g. `TKT-840192`)

---

## 🚫 9. Specimen Request Already Submitted Template

### **Template Name**: `specimen_already_submitted_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `NEWLY CREATED`
- **Buttons**: None

#### **Message Content**:
> Hello `{{1}}`,
>
> We noticed you requested a specimen copy of "`{{2}}`". Our records show that a specimen copy for this book was already requested/processed on `{{3}}`.
>
> Each book can only be requested once per teacher. If you need additional copies for your institution, please place a regular or bulk order.
>
> Thank you for your understanding!  
> **Cremson Publications Team**

- **Variables**:
  - `{{1}}` = Teacher Name
  - `{{2}}` = Book Title (e.g. `Mathematics Class 10`)
  - `{{3}}` = Previous Request Date (e.g. `2026-08-15`)

---

## ⭐ 10. Feedback & Book Review Request Template

### **Template Name**: `review_request_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `NEWLY CREATED`
- **Buttons**: Dynamic URL CTA Button (`Leave Review`)

#### **Message Content**:
> Hello `{{1}}`,
>
> We hope you are enjoying your recent order of "`{{2}}`" from Cremson Publications!
>
> Could you please take a quick moment to share your feedback and rate your experience? Your review helps us continue delivering high-quality educational materials.
>
> Leave your review here: `{{3}}`
>
> Thank you for your support!  
> **Cremson Publications Team**
>
> *(Button: Leave Review)*

- **Variables**:
  - `{{1}}` = Customer / Teacher Name
  - `{{2}}` = Book / Item Name
  - `{{3}}` = Direct Review URL (e.g. `https://cremsonpublications.com/shop/product/12?review=true`)
- **Button Parameter**: Review Link URL (`{{3}}`)

---

## 🔁 11. Reorder Reminder Template

### **Template Name**: `reorder_reminder_v1`
- **Category**: `UTILITY`
- **Language**: English (`en`)
- **Status**: `NEWLY CREATED`
- **Buttons**: Dynamic URL CTA Button (`Reorder Now`)

#### **Message Content**:
> Hello `{{1}}`,
>
> Thank you for choosing Cremson Publications! We hope your recent books ("`{{2}}`") have been very helpful for your studies/teaching.
>
> Need extra copies or new academic books for your upcoming session, students, or institution? Explore our latest curriculum and place a reorder easily today.
>
> Browse Catalog & Reorder: `{{3}}`
>
> Thank you for your continued support!  
> **Cremson Publications Team**
>
> *(Button: Reorder Now)*

- **Variables**:
  - `{{1}}` = Customer / Teacher Name
  - `{{2}}` = Previous Order Item(s) Description
  - `{{3}}` = Catalog Reorder Link URL (`https://cremsonpublications.com/shop`)
- **Button Parameter**: Catalog Reorder URL (`{{3}}`)
