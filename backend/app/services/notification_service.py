import os
import smtplib
from email.message import EmailMessage


def send_email_notification(
    subject: str,
    message: str,
) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    notification_email = os.getenv("NOTIFICATION_EMAIL")

    if not all(
        [
            smtp_host,
            smtp_username,
            smtp_password,
            notification_email,
        ]
    ):
        print("Email notification is not configured.")
        return False

    email = EmailMessage()
    email["Subject"] = subject
    email["From"] = smtp_username
    email["To"] = notification_email
    email.set_content(message)

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(email)

        print("Security notification email sent successfully.")
        return True

    except Exception as error:
        print(f"Failed to send security notification email: {error}")
        return False