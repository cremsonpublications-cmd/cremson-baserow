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

