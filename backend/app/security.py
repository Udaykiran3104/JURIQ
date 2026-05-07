import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import bcrypt
import random
import secrets
from datetime import datetime, timedelta

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def generate_otp():
    return str(random.randint(100000, 999999))

def generate_secure_token():
    """Generates a secure 32-character token for password resets"""
    return secrets.token_hex(16)

def send_otp_email(receiver_email: str, otp: str, purpose: str):
    # --- UPDATE THESE CREDENTIALS ---
    SENDER_EMAIL = "juriq.ai.bot@gmail.com" 
    APP_PASSWORD = "lbaw ttze voee nfuc" 
    
    # Contextual wording based on purpose
    if purpose == "reset":
        subject = "Reset your JURIQ Password"
        title = "Password Reset Request"
        message = "We received a request to reset your password. Use the verification code below to proceed."
    elif purpose == "set_password":
        subject = "Set your JURIQ Password"
        title = "Set Account Password"
        message = "You are setting a local password for your Google-linked account. Use the code below."
    else:
        subject = "Verify your JURIQ Account"
        title = "Verify your email address"
        message = "Thank you for registering with JURIQ. To complete your secure sign-up process, please use the verification code below."

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; max-width: 600px;">
                        <tr>
                            <td style="background-color: #0c325e; padding: 30px 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">JURIQ</h1>
                                <p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 14px;">Department of Justice AI Assistant</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 40px;">
                                <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">{title}</h2>
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                                    Hello,<br><br>{message}
                                </p>
                                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                                    <span style="display: block; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Verification Code</span>
                                    <span style="font-size: 36px; font-weight: bold; color: #0c325e; letter-spacing: 4px;">{otp}</span>
                                </div>
                                <p style="color: #ef4444; font-size: 14px; text-align: center;">&#8987; This code will expire in 10 minutes.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['From'] = f"JURIQ AI Assistant <{SENDER_EMAIL}>"
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[{purpose.upper()}] OTP sent successfully to {receiver_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise Exception("Could not send OTP email. Check SMTP credentials.")