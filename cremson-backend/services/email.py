import os
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List

SMTP_HOST = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("BREVO_SMTP_PORT", "587"))
SMTP_USER = os.getenv("BREVO_SMTP_USER", "")
SMTP_KEY  = os.getenv("BREVO_SMTP_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "")
FROM_NAME  = os.getenv("FROM_NAME", "Cremson Publications")


async def send_verification_email(to_email: str, to_name: str, otp: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Verify your email address</h2>
        <p style="color:#6b7280;font-size:15px;margin:0 0 28px;">
          Hi <strong>{to_name}</strong>, use the OTP below to verify your account.
          It expires in <strong>15 minutes</strong>.
        </p>
        <div style="background:#f3f4f6;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
          <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#dc2626;">{otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your verification code is {otp} — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{to_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_KEY,
        start_tls=True,
    )


async def send_teacher_signup_email(to_email: str, to_name: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Registration Received 🎓</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{to_name}</strong>, thank you for registering as an Educator with Cremson Publications!
        </p>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Your teacher account application has been received and is currently under review by our administration team. 
          Once verified and approved, you will receive another email confirmation granting you access to free specimen copies, answer keys, and teaching materials.
        </p>
        <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:24px;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Need assistance? Reach out to us at support@cremsonpublications.com
          </p>
        </div>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Teacher Registration Received — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{to_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_KEY,
        start_tls=True,
    )


async def send_teacher_approved_email(to_email: str, to_name: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#059669;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Account Approved! 🎉</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Dear <strong>{to_name}</strong>,
        </p>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Great news! Your Educator account with <strong>Cremson Publications</strong> has been approved by our team.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 8px;">What you can do now:</p>
          <ul style="color:#15803d;font-size:13px;margin:0;padding-left:20px;line-height:1.6;">
            <li>Request free Specimen Copies for your school</li>
            <li>Download Teacher Answer Keys & Resource Files</li>
            <li>Access Exclusive Educational Support Material</li>
          </ul>
        </div>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="https://cremsonpublications.com/auth/signin" style="background:#059669;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
            Log In to Your Account
          </a>
        </div>
        <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:24px;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Thank you for partnering with Cremson Publications.
          </p>
        </div>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Congratulations! Your Teacher Account has been Approved — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{to_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_KEY,
        start_tls=True,
    )


async def send_teacher_rejected_email(to_email: str, to_name: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Registration Status Update</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Dear <strong>{to_name}</strong>,
        </p>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Thank you for your interest in Cremson Publications. Regarding your teacher account registration, our administration team was unable to verify your teacher account details at this time.
        </p>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 24px;">
          If you believe this decision was made in error or if you have updated school details to provide, please reply to this email or contact support.
        </p>
        <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:24px;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Support Team — Cremson Publications
          </p>
        </div>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Teacher Registration Update — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{to_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_KEY,
        start_tls=True,
    )


async def send_order_confirmation_email(
    to_email: str,
    customer_name: str,
    order_id: str,
    total_amount: float,
    transaction_id: str = "-",
    items: Optional[List[dict]] = None,
):
    if not to_email:
        return
    formatted_items = ""
    if items:
        lines = []
        for item in items:
            name = item.get("name") or item.get("title") or "Book"
            qty = item.get("quantity") or item.get("qty") or 1
            price = item.get("currentPrice") or item.get("price") or 0.0
            total_price = item.get("totalPrice") or (price * qty)
            lines.append(f"<li><strong>{name}</strong> (Qty: {qty}) — ₹{total_price:.2f}</li>")
        formatted_items = f"<ul>{''.join(lines)}</ul>"
    else:
        formatted_items = "<p>Item details inside your order history.</p>"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Order Confirmed! 📦</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{customer_name}</strong>, thank you for your order! Your payment has been confirmed.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;font-size:14px;color:#4b5563;">
          <p style="margin:0 0 8px;"><strong>Order ID:</strong> {order_id}</p>
          <p style="margin:0 0 8px;"><strong>Transaction ID:</strong> {transaction_id}</p>
          <p style="margin:0 0 8px;"><strong>Total Amount:</strong> ₹{total_amount:.2f}</p>
        </div>
        <div style="margin-bottom:20px;font-size:14px;color:#374151;">
          <p style="margin:0 0 8px;font-weight:700;">Items Ordered:</p>
          {formatted_items}
        </div>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Order Confirmation #{order_id} — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{customer_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_order_status_update_email(
    to_email: str,
    customer_name: str,
    order_id: str,
    new_status: str,
):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Order Status Update</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{customer_name}</strong>, your order <strong>#{order_id}</strong> status has been updated to: <strong style="color:#dc2626;">{new_status}</strong>.
        </p>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Order #{order_id} Status Update — {new_status}"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{customer_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_payment_failed_email(
    to_email: str,
    customer_name: str,
    order_id: str,
    amount: float,
):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#dc2626;font-size:20px;margin:0 0 8px;">Payment Failed</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{customer_name}</strong>, the payment of <strong>₹{amount:.2f}</strong> for order <strong>#{order_id}</strong> was not successful.
          Please try again or contact support if the amount was deducted from your account.
        </p>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Payment Failed for Order #{order_id}"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{customer_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_shipment_created_email(
    to_email: str,
    customer_name: str,
    order_id: str,
    awb: str,
    courier_name: str,
    tracking_url: str,
):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Your order has shipped! 🚚</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{customer_name}</strong>, your order <strong>#{order_id}</strong> is on its way.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;font-size:14px;color:#4b5563;">
          <p style="margin:0 0 8px;"><strong>Courier Name:</strong> {courier_name}</p>
          <p style="margin:0 0 8px;"><strong>Tracking AWB:</strong> {awb}</p>
        </div>
        <div style="text-align:center;margin-bottom:20px;">
          <a href="{tracking_url}" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
            Track Your Shipment
          </a>
        </div>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your order #{order_id} has shipped — AWB {awb}"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{customer_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_shipment_status_email(
    to_email: str,
    customer_name: str,
    order_id: str,
    status_key: str,
    tracking_url: str = "",
):
    if not to_email:
        return
    status_text_map = {
        "PICKED_UP": "has been picked up by our courier partner",
        "IN_TRANSIT": "is in transit to your location",
        "OUT_FOR_DELIVERY": "is out for delivery today",
        "DELIVERED": "has been successfully delivered! 🎉",
        "RTO": "is returning to origin (RTO)",
    }
    desc = status_text_map.get(status_key, f"status has been updated to {status_key}")
    
    track_button = ""
    if tracking_url and status_key != "DELIVERED":
        track_button = f"""
        <div style="text-align:center;margin-bottom:20px;margin-top:20px;">
          <a href="{tracking_url}" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
            Track Shipment
          </a>
        </div>
        """

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Shipment Status Update</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{customer_name}</strong>, your shipment for order <strong>#{order_id}</strong> {desc}.
        </p>
        {track_button}
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Shipment status update for order #{order_id}"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{customer_name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_bulk_order_received_email(to_email: str, name: str, school: str, order_link: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Bulk Order Received</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{name}</strong>, thank you for submitting a bulk order request for <strong>{school}</strong>.
          Our team is reviewing your order details.
        </p>
        <div style="text-align:center;margin-bottom:20px;">
          <a href="{order_link}" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
            View Order Details
          </a>
        </div>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "We have received your Bulk Order request — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_bulk_order_approved_email(to_email: str, name: str, school: str, total: float, payment_link: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#059669;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Bulk Order Approved! 🎉</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{name}</strong>, your bulk order for <strong>{school}</strong> has been approved.
          The total due amount is <strong>₹{total:.2f}</strong>.
        </p>
        <div style="text-align:center;margin-bottom:20px;">
          <a href="{payment_link}" style="background:#059669;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
            Proceed to Payment
          </a>
        </div>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Approved: Bulk Order payment link — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_bulk_order_payment_received_email(to_email: str, name: str, school: str, amount: float, order_link: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#059669;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Bulk Order Payment Confirmed</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{name}</strong>, we have received a payment of <strong>₹{amount:.2f}</strong> for the bulk order of <strong>{school}</strong>.
          We are preparing your books for dispatch.
        </p>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Bulk Order payment received — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_bulk_order_shipped_email(to_email: str, name: str, school: str, awb: str, tracking_link: str, order_link: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Bulk Order Shipped! 🚚</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{name}</strong>, your bulk order shipment for <strong>{school}</strong> has been dispatched.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;font-size:14px;color:#4b5563;">
          <p style="margin:0 0 8px;"><strong>Tracking AWB:</strong> {awb}</p>
        </div>
        <div style="text-align:center;margin-bottom:20px;">
          <a href="{tracking_link}" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
            Track Your Shipment
          </a>
        </div>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Bulk order for {school} has been shipped — AWB {awb}"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_specimen_received_email(to_email: str, name: str, book_count: int):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Specimen Request Received</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{name}</strong>, we have successfully received your request for <strong>{book_count}</strong> specimen copy/copies.
          Our team is reviewing your request.
        </p>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Specimen Request Received — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_specimen_rejected_email(to_email: str, name: str, books_requested: str):
    if not to_email:
        return
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Specimen Request Update</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>{name}</strong>, your specimen request for the following books has been reviewed and was not approved at this time:
          <br/><strong>{books_requested}</strong>
        </p>
      </div>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Specimen Request Status Update — Cremson Publications"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = f"{name} <{to_email}>"
    msg.attach(MIMEText(html, "html"))
    await aiosmtplib.send(msg, hostname=SMTP_HOST, port=SMTP_PORT, username=SMTP_USER, password=SMTP_KEY, start_tls=True)


async def send_contact_us_email(full_name: str, phone: str, email: str, message: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#2563eb;padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Cremson Publications</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">New Contact Us Message ✉️</h2>
        <div style="margin-bottom:20px; font-size:14px; line-height:1.6; color:#374151;">
          <p><strong>Name:</strong> {full_name}</p>
          <p><strong>Phone:</strong> {phone}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Message:</strong></p>
          <div style="background:#f3f4f6; padding:15px; border-radius:8px; white-space:pre-wrap; margin-top:8px;">{message}</div>
        </div>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New website query from {full_name}"
    msg["From"]    = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"]      = "info@cremsonpublications.com"
    if email:
        msg["Reply-To"] = email
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_KEY,
        start_tls=True,
    )


