import smtplib
from email.mime.text import MIMEText

SENDGRID_USERNAME = "apikey"
SENDGRID_PASSWORD = "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"  # ← вставь сюда
FROM_EMAIL = "evijaparnumerologiju@gmail.com"
TO_EMAIL = "evijaparnumerologiju@gmail.com"

msg = MIMEText("Test message from SMTP relay")
msg["Subject"] = "SMTP test"
msg["From"] = FROM_EMAIL
msg["To"] = TO_EMAIL

with smtplib.SMTP("smtp.sendgrid.net", 587) as server:
    server.starttls()
    server.login(SENDGRID_USERNAME, SENDGRID_PASSWORD)
    server.send_message(msg)

print("Test email sent!")
