import os
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

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
