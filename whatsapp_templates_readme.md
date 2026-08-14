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
  > Thank you for your order! Your order **#ORD-98765** has been placed successfully.
  > 
  > **Transaction ID:** TXN-1002030405
  > 
  > **Items Ordered:**
  > • NCERT English Reader (2 x ₹150.00) = ₹300.00
  > • Mathematics Class 10 (1 x ₹450.00) = ₹450.00
  > 
  > **Total Amount:** ₹750.00

---

## 2. Payment Failed (`payment_failed_v6`)
* **Trigger:** Sent to a customer when a checkout payment transaction fails.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order Amount
  * `{{3}}` - Order ID
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Your payment of **₹750.00** for order **#ORD-98765** has failed. Please check your payment details and try again or contact support if the amount was debited.

---

## 3. OTP Verification (`cremson_otp`)
* **Trigger:** Sends a 6-digit verification code to log in or register. This includes a native **"Copy Code"** button.
* **Template Parameters:**
  * `{{1}}` - OTP (Body & Button parameter)
* **Example Output:**
  > **834921** is your verification code for Cremson Publications. Please do not share this OTP with anyone.
  > 
  > `[ Copy Code ]` *(Actionable button)*

---

## 4. Shipment Created (`shipment_created_v1`)
* **Trigger:** Sent when a tracking number (AWB) is generated in Shipway.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
  * `{{3}}` - AWB (Tracking Number)
  * `{{4}}` - Courier Partner Name
  * `{{5}}` - Tracking Link
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Good news! Your order **#ORD-98765** has been packed.
  > 
  > **Tracking Number (AWB):** 9876543210
  > **Courier:** BlueDart
  > 
  > You can track your shipment here: https://cremsonpublications.shipway.com/tracking/9876543210

---

## 5. Shipment Picked Up (`picked_up_v1`)
* **Trigger:** Sent when the courier agent scans and picks up the parcel.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
  * `{{3}}` - Tracking Link
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Your shipment for order **#ORD-98765** has been picked up by the courier. Track here: https://cremsonpublications.shipway.com/tracking/9876543210

---

## 6. Shipment In Transit (`in_transit_v1`)
* **Trigger:** Sent when the package is moving between shipping hubs.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
  * `{{3}}` - Tracking Link
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Your order **#ORD-98765** is currently in transit. Track here: https://cremsonpublications.shipway.com/tracking/9876543210

---

## 7. Out For Delivery (`out_for_delivery_v2`)
* **Trigger:** Sent on the morning of delivery when the package is out with the delivery agent.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
  * `{{3}}` - Tracking Link
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Get ready! Your order **#ORD-98765** is out for delivery today. Track live status: https://cremsonpublications.shipway.com/tracking/9876543210

---

## 8. Delivered (`delivered_v2`)
* **Trigger:** Sent as a confirmation when delivery is successful.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > Your package for order **#ORD-98765** has been successfully delivered! Thank you for shopping with us.

---

## 9. Return to Origin (`rto_v2`)
* **Trigger:** Sent if the parcel could not be delivered and is returning to the warehouse.
* **Template Parameters:**
  * `{{1}}` - Customer Name
  * `{{2}}` - Order ID
* **Example Output:**
  > Hello **Jane Doe**,
  > 
  > We noticed that your order **#ORD-98765** could not be delivered and is being returned to our warehouse. Please contact support to arrange a redelivery.

---

## 10. Specimen Copy Requested (`specimen_received_v1`)
* **Trigger:** Sent to teachers upon submission of a request for free evaluation copies.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - Book count
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > We have received your request for **3** specimen books. Our team will verify your teacher credentials and update you shortly.

---

## 11. Specimen Copy Rejected (`specimen_rejected_v1`)
* **Trigger:** Sent to teachers if their specimen request is rejected.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - Description of requested books
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > We regret to inform you that your request for **Mathematics Class 10 & 11 Specimen Copies** was not approved at this time. If you think this was an error, please reach out to us.

---

## 12. Bulk Order Requested (`bulk_order_requested_v1`)
* **Trigger:** Sent to a teacher when they submit a new bulk book order.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - School Name
  * `{{3}}` - View Link
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > Your bulk order request for **Springdale Public School** has been received. Our team will review the discount details and send your payment link shortly.
  > 
  > View status: http://localhost:3000/bulk-order/TOKEN_123

---

## 13. Bulk Order Approved (`bulk_order_approved_v10`)
* **Trigger:** Sent to a teacher with the updated price and payment link once approved by the admin.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - School Name
  * `{{3}}` - Discounted total price
  * `{{4}}` - Payment/order link
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > Great news! Your bulk order for **Springdale Public School** has been approved with a discount. 
  > 
  > **Final Discounted Total:** ₹18,500.00
  > 
  > Click here to pay: http://localhost:3000/bulk-order/TOKEN_123

---

## 14. Bulk Order Shipped (`bulk_order_shipped_v1`)
* **Trigger:** Sent to a teacher when their bulk order is dispatched.
* **Template Parameters:**
  * `{{1}}` - Teacher Name
  * `{{2}}` - School Name
  * `{{3}}` - AWB (Tracking Number)
  * `{{4}}` - Tracking Link
* **Example Output:**
  > Hello **Prof. Arthur**,
  > 
  > Your bulk order for **Springdale Public School** has been dispatched!
  > 
  > **AWB:** 1122334455
  > **Track Package:** https://cremsonpublications.shipway.com/tracking/1122334455


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
| **Authentication** | User requests a mobile verification code on the web login. | `cremson_otp` | **834921** is your verification code for Cremson Publications. Please do not share this OTP with anyone. |
| **New Specimen Copy** | A teacher submits a specimen book request on the website. | `specimen_received_v1` | Hello **Prof. Arthur**, We have received your request for **3** specimen books. Our team will verify your teacher credentials and update you shortly. |
| **Bulk Order Approved** | Admin reviews a teacher's bulk order and applies a discount. | `bulk_order_approved_v10` | Hello **Prof. Arthur**, Great news! Your bulk order for **Springdale Public School** has been approved with a discount. **Final Discounted Total:** ₹18,500.00. Click here to pay: *payment_link* |
| **Order Placed** | Customer completes checkout and pays successfully. | `order_confirmation_v6` | Hello **Jane Doe**, Thank you for your order! Your order **#ORD-98765** has been placed successfully. **Total Paid:** ₹750.00 |
| **Courier Shipped** | Package dispatch is processed with Shipway. | `shipment_created_v1` | Hello **Jane Doe**, Good news! Your order **#ORD-98765** has been packed. **Courier:** BlueDart. **AWB:** 9876543210 |

