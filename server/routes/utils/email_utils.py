# email_utils.py (EmailJS API for sending email verification)
import requests

def send_verification_email(to_email, name, username, password, verification_url):
    service_id = "service_vxd69mg"  # Your actual EmailJS service ID
    template_id = "template_epnlvbr"  # Replace with your actual EmailJS template ID
    user_id = "tEd5iWqPCi7GXWqap"  # Found under EmailJS Account > API Keys

    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": user_id,
        "template_params": {
            "to_name": name,
            "username": username,
            "password": password,
            "link": verification_url,
            "to_email": to_email
        }
    }

    try:
        response = requests.post("https://api.emailjs.com/api/v1.0/email/send", json=payload)
        if response.status_code == 200:
            print(f"Email sent to {to_email}")
        else:
            print(f" Failed to send email: {response.status_code} - {response.text}")
    except Exception as e:
        print(f" Error sending email: {e}")

    # Optional: Log results to a file
    with open("email_log.txt", "a") as log_file:
        log_msg = f"Sent to: {to_email} | Status: {response.status_code if 'response' in locals() else 'error'}\n"
        log_file.write(log_msg)
