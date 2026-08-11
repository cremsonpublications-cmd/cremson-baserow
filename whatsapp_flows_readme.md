# Cremson Publications — WhatsApp Webhooks, Chatbot Flows & Meta Templates

This document details all WhatsApp communications in the Cremson Publications codebase. It covers Meta Templates, interactive user chatbot flows, triggers, status transitions, and automatic notifications.

---

## 1. Meta Message Templates

These templates are pre-approved in your Meta WhatsApp Manager. They are used for outbound notifications and can be sent to customers at any time (bypassing Meta's 24-hour window restriction).

| Template Name | Category | Language | Purpose / Trigger | Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **`cremson_otp`** | Authentication | `en` | Customer OTP sign-in / verification code | `{{1}}` = Verification Code (OTP) |
| **`specimen_received_v1`** | Utility | `en` | Confirm specimen request is submitted | `{{1}}` = Name, `{{2}}` = Book Name |
| **`specimen_dispatched`** | Utility | `en_GB` | Sent when specimen is shipped via courier | `{{1}}` = Name, `{{2}}` = AWB, `{{3}}` = Delivery Days |
| **`specimen_rejected_v1`** | Utility | `en` | Specimen copy request rejected | `{{1}}` = Name, `{{2}}` = Book Name, `{{3}}` = Reason |
| **`specimen_blacklist_deny`** | Utility | `en` | Denied because of prior blacklist / request | `{{1}}` = Name |
| **`order_confirmation_v6`** | Utility | `en` | Retail order paid successfully | `{{1}}` = Name, `{{2}}` = Order ID, `{{3}}` = Txn ID, `{{4}}` = Items, `{{5}}` = Total |
| **`payment_failed_v6`** | Utility | `en` | Retail payment failed / cancelled | `{{1}}` = Name, `{{2}}` = Total, `{{3}}` = Order ID |
| **`bulk_payment_request`** | Utility | `en` | Request manual UPI/NEFT screenshot | `{{1}}` = Name |
| **`bulk_order_requested_v1`** | Utility | `en` | Confirm school bulk order requested | `{{1}}` = Name, `{{2}}` = School Name, `{{3}}` = Tracking Link |
| **`bulk_order_approved_v10`** | Utility | `en` | Admin approved school bulk order with pricing | `{{1}}` = Name, `{{2}}` = School Name, `{{3}}` = Final Amount, `{{4}}` = Checkout Link |
| **`bulk_order_shipped_v1`** | Utility | `en` | School bulk order shipped from warehouse | `{{1}}` = Name, `{{2}}` = School Name, `{{3}}` = AWB Number, `{{4}}` = Tracking Link |

---

## 2. Interactive Chatbot Flows

Incoming messages from users on your WhatsApp number trigger the automated chatbot. The rules and responses are managed in `services/whatsapp_chat.py`.

### A. Main Menu / Welcome Flow
* **Trigger Words:** `hi`, `hello`, `hey`, `menu`, `help`, `start`
* **Bot Response:** Sends an interactive list menu with option sections:
  1. **Specimen Copy Requests:**
     * *Request Specimen Copy* (initiates step-by-step teacher form)
     * *Track Specimen Request* (prompts for status lookup)
  2. **Bulk Orders:**
     * *Create Bulk Order* (gives school bulk form link)
     * *Split Student Payments* (explains the link split payment flow)
  3. **Order Status:**
     * *Track Retail Order* (prompts for order tracking)

### B. Interactive Specimen Request Flow (Step-by-Step)
* **Trigger Option:** User selects *"Request Specimen Copy"* or types *"specimen"*.
* **Step 1:** Bot asks: *"Please reply with your Full Name."*
* **Step 2:** Bot asks: *"Please reply with your School/Institution Name."*
* **Step 3:** Bot asks: *"Please reply with your City."*
* **Step 4:** Bot asks: *"Please reply with your Pincode."*
* **Step 5:** Bot sends book catalog list options to choose the copy, then submits the request to Baserow.

---

## 3. Shipping Status Updates (Shipway Webhooks)

When packages are processed by your courier company, Shipway posts webhook events to `/api/webhooks/whatsapp` (in `routers/webhooks.py`). This automatically sends the following template notifications:

1. **`PICKED_UP`** $\rightarrow$ Triggers template **`picked_up_v1`**
2. **`IN_TRANSIT`** $\rightarrow$ Triggers template **`in_transit_v1`**
3. **`OUT_FOR_DELIVERY`** Triggers template **`out_for_delivery_v2`**
4. **`DELIVERED`** $\rightarrow$ Triggers template **`delivered_v2`**
5. **`RTO` (Return to Origin)** $\rightarrow$ Triggers template **`rto_v2`**
