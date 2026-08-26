# WhatsApp Message Templates

This document lists all active and approved Meta WhatsApp Business templates currently used in the Cremson Publications platform.

---

## 1. Order Confirmation (`order_confirmation_v6`)
* **Trigger:** Sent to customers immediately after successful order placement and payment confirmation.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
  * `{{3}}` - Transaction ID / Reference ID
  * `{{4}}` - Itemized list of books ordered
  * `{{5}}` - Total amount paid
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Thank you for ordering from Cremson Publications! Your order **#ORD-98765** has been successfully placed.
  > 
  > **Transaction ID:** TXN-1002030405
  > 
  > **Items Ordered:**
  > • NCERT English Reader (2 x ₹150.00) = ₹300.00
  > • Mathematics Class 10 (1 x ₹450.00) = ₹450.00
  > 
  > **Total Amount:** ₹750.00
  > 
  > We are preparing your order for shipping and will update you with tracking details as soon as it dispatches!
  > 
  > Best regards, Cremson Publications Team

---

## 2. Payment Failed (`payment_failed_v6`)
* **Trigger:** Sent to a customer when a checkout payment transaction fails.
* **Buttons:** `Retry Payment` (dynamic URL CTA button)
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order Amount
  * `{{3}}` - Order ID
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > We noticed that your payment of **₹750.00** for Order ID **#ORD-98765** was unsuccessful.
  > 
  > Don't worry! Your items are still saved in your cart. You can retry the payment by clicking the link below or visiting your cart.
  > 
  > If the amount was deducted from your account, please check with your bank or contact our support team with the payment reference.
  > 
  > Best regards, Cremson Publications Team
  > 
  > `[ Retry Payment ]` *(Actionable URL button)*

---

## 3. OTP Verification (`cremson_otp`)
* **Trigger:** Sends a 6-digit verification code to log in or register. This includes a native **"Copy Code"** button.
* **Template Parameters:**
  * `{{1}}` - OTP (Body & Button parameter)
* **Example Output:**
  > **834921** is your verification code for Cremson Publications. For security reasons, do not share this code with anyone.
  > 
  > `[ Copy Code ]` *(Actionable button)*

---

## 4. Shipment Created (`shipment_created_v1`)
* **Trigger:** Sent when a tracking number (AWB) is generated in Shipway.
* **Buttons:** `Track your Order` (dynamic URL CTA button)
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
  * `{{3}}` - AWB (Tracking Number)
  * `{{4}}` - Courier Partner Name
  * `{{5}}` - Live Tracking Link URL
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Great news! Your order **#ORD-98765** has been packed and dispatched via **BlueDart**.
  > 
  > **AWB Tracking Number:** 9876543210
  > **Track your parcel live:** https://cremsonpublications.shipway.com/tracking/9876543210
  > 
  > Thank you for shopping with Cremson Publications!
  > 
  > `[ Track your Order ]` *(Actionable URL button)*

---

## 5. Out For Delivery (`out_for_delivery_v2`)
* **Trigger:** Sent on the morning of delivery when the package is out with the delivery agent.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
  * `{{3}}` - Tracking Link
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Your package for Order **#ORD-98765** is out for delivery today! Please ensure someone is available at your delivery address to receive it.
  > 
  > Track Delivery Agent: https://cremsonpublications.shipway.com/tracking/9876543210
  > 
  > Cremson Publications

---

## 6. Delivered (`delivered_v2`)
* **Trigger:** Sent as a confirmation when delivery is successful.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Your order **#ORD-98765** has been successfully delivered!
  > 
  > We hope you enjoy reading your new books. If you have a moment, please leave us a review on our website.
  > 
  > Thank you for choosing Cremson Publications!

---

## 7. Return to Origin (`rto_v2`)
* **Trigger:** Sent if the parcel could not be delivered and is returning to the warehouse.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Delivery was attempted for Order **#ORD-98765** but could not be completed. The parcel is being returned to our warehouse.
  > 
  > Please contact our support team if you need assistance or re-shipment.
  > 
  > Cremson Publications

---

## 8. Specimen Copy Requested (`specimen_received_v1`)
* **Trigger:** Sent to teachers upon submission of a request for free evaluation copies.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - Book count
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > Thank you for requesting specimen copies (3 book(s)) from Cremson Publications. Our team is verifying your school details and will dispatch your copies soon.
  > 
  > Cremson Publications

---

## 9. Specimen Copy Rejected (`specimen_rejected_v1`)
* **Trigger:** Sent to teachers if their specimen request is rejected.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - Description of requested books
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > Thank you for your interest in Cremson Publications.
  > 
  > Regarding your specimen request (**Mathematics Class 10 & 11 Specimen Copies**), we were unable to approve the request at this time. If you have questions, please reach out to our support team.
  > 
  > Cremson Publications

---

## 10. Bulk Order Requested (`bulk_order_requested_v1`)
* **Trigger:** Sent to a teacher when they submit a new bulk book order.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - School Name
  * `{{3}}` - View Link
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > We have received your bulk order request for **Springdale Public School**. Our team is reviewing the request and will apply special bulk institution pricing shortly.
  > 
  > View request status: https://cremsonpublications.com/bulk-order/TOKEN_123
  > 
  > Cremson Publications

---

## 11. Bulk Order Approved (`bulk_order_approved_v10`)
* **Trigger:** Sent to a teacher with the updated price and payment link once approved by the admin.
* **Buttons:** `Make Payment` (dynamic URL CTA button)
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - School Name
  * `{{3}}` - Discounted total price
  * `{{4}}` - Payment/order link
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > Good news! Your bulk order request for **Springdale Public School** has been approved with special discounted pricing.
  > 
  > **Final Amount Payable:** ₹18,500.00
  > 
  > Complete Payment Here: https://cremsonpublications.com/bulk-order/TOKEN_123
  > 
  > Cremson Publications
  > 
  > `[ Make Payment ]` *(Actionable URL button)*

---

## 12. Bulk Order Shipped (`bulk_order_shipped_v1`)
* **Trigger:** Sent to a teacher when their bulk order is dispatched.
* **Buttons:** `Track Shipment` (dynamic URL CTA button)
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - School Name
  * `{{3}}` - AWB (Tracking Number)
  * `{{4}}` - Tracking Link
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > The bulk shipment for **Springdale Public School** has been dispatched!
  > 
  > **AWB Number:** 1122334455
  > **Track Shipment:** https://cremsonpublications.shipway.com/tracking/1122334455
  > 
  > Cremson Publications
  > 
  > `[ Track Shipment ]` *(Actionable URL button)*


---

# WhatsApp Message Types & Flow Comparison

This section differentiates between **Interactive Chatbot Flows (User-Initiated)** and **System-Generated Notifications (Automated Transactional Pushes)**.

---

## Type 1: Interactive Chatbot Flows (User-Initiated)

These flows act as a live chatbot where the conversation is started by a user sending a message. The chatbot matches keywords/regex and responds dynamically.

### A. Main Welcome Menu
* **Trigger Words:** `"Hi"`, `"Hello"`, `"Start"`, `"Menu"`, `"Main"`
* **User:** `hi`
* **Bot Response:**
  > 👋 Welcome to Cremson Publications! 📚
  > 
  > How can we assist you today?
  > 
  > 1️⃣ Teachers Section
  > 2️⃣ Buy Books
  > 3️⃣ Track Your Order
  > 4️⃣ Request Specimen Copy
  > 5️⃣ Bulk Order Inquiry
  > 6️⃣ Contact Support
  > 
  > Reply with the number or option name.

### B. Teacher Registration Flow (Step-by-Step)
1. **User Selection:** `1` (or `Teachers Section`)
2. **Bot Response:**
   > Are you currently registered with Cremson Publications?
   > 1️⃣ Registered
   > 2️⃣ Unregistered / New Teacher
3. **User Selection:** `2` (or `Unregistered / New Teacher`)
4. **Bot Response:**
   > Let's set up your profile! Please type your **Full Name**:
5. **User Inputs:** `Prof. Jane Doe`
6. **Bot Response:**
   > Got it! 👍 Next, please type your **School Name** along with the **City/Location** (e.g., DPS, Rohini):
7. **User Inputs:** `St. Xavier School, Delhi`
8. **Bot Response:**
   > Perfect. Which **Subject(s)** and **Classes (6-12)** do you teach?
9. **User Inputs:** `Mathematics Class 10`
10. **Bot Response:**
    > To safeguard our teaching resources and answer keys, we only share access with verified educators. 🛡️
    > Please send a photo or document of your **School ID Card, Visiting Card, or School Letterhead**:
11. **User Sends Image** *(ID Card)*
12. **Bot Response:**
    > Thank you! All your details and documents have been successfully submitted. 🎉 Our team will review your profile and activate your verified teacher access within 24 hours.

### C. Specimen Receipt & Feedback Flow
* **User Input:** `specimen copies received` (or matches: `"received"`, `"got books"`)
* **Bot Response:**
  > Thank you for confirming! 🎉 We're thrilled your specimen copies have reached you safely. 📚
  > Our team will soon share exclusive FREE study material for your students — stay tuned! 😊
  > Just reply:
  > 💬 FEEDBACK — to share your experience
  > ✅ YES — when you're ready to place a bulk order
  > ⏰ LATER — if you need more time
* **User Input:** `Feedback`
* **Bot Response:**
  > Thank you so much for taking the time! 💛 We truly value your perspective as an educator.
  > Please share your honest thoughts on the specimen book — what you liked, what could be better, and how suitable you found it for your students.📝

---

## Type 2: System-Generated Notifications (Automated Triggers)

These notifications are pushed automatically by the backend server in response to user or admin actions on the website/database, without requiring the user to start a conversation first.

| Event | Trigger Action | Template / Message Type | Example Sent |
| :--- | :--- | :--- | :--- |
| **Authentication** | User requests a mobile verification code on the web login. | `cremson_otp` | **834921** is your verification code for Cremson Publications. For security reasons, do not share this code with anyone. |
| **New Specimen Copy** | A teacher submits a specimen book request on the website. | `specimen_received_v1` | Hello **Prof. Arthur**, Thank you for requesting specimen copies (3 book(s)) from Cremson Publications. Our team is verifying your school details and will dispatch your copies soon. |
| **Bulk Order Approved** | Admin reviews a teacher's bulk order and applies a discount. | `bulk_order_approved_v10` | Hello **Prof. Arthur**, Good news! Your bulk order request for **Springdale Public School** has been approved with special discounted pricing. **Final Amount Payable:** ₹18,500.00 |
| **Order Placed** | Customer completes checkout and pays successfully. | `order_confirmation_v6` | Hello **Jane Doe**, Thank you for ordering from Cremson Publications! Your order **#ORD-98765** has been successfully placed. **Total Paid:** ₹750.00 |
| **Courier Shipped** | Package dispatch is processed with Shipway. | `shipment_created_v1` | Hello **Jane Doe**, Great news! Your order **#ORD-98765** has been packed and dispatched via **BlueDart**. |
