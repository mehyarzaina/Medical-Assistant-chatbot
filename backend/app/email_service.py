#email_service.py
"""
Sends appointment confirmation emails via personal Gmail SMTP.
smtplib is blocking, so this is called via FastAPI's BackgroundTasks
(see appointments.py) rather than awaited directly in the request path.
"""

import smtplib
from datetime import date as date_type
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import get_settings

settings = get_settings()


def _build_html(
    patient_name: str,
    doctor_name: str,
    date: date_type,
    time: str,
    appointment_id: str,
    access_token: str,
) -> str:
    cancel_url = f"{settings.frontend_base_url}/appointments/{appointment_id}/cancel?token={access_token}"
    reschedule_url = f"{settings.frontend_base_url}/appointments/{appointment_id}/reschedule?token={access_token}"
    date_display = date.strftime("%A, %B %d, %Y")

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f766e; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px;">Appointment Confirmed ✅</h2>
      </div>
      <div style="padding: 24px; color: #111827;">
        <p style="font-size: 15px;">Hi {patient_name},</p>
        <p style="font-size: 15px;">Your appointment has been booked. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Doctor</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{doctor_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Date</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{date_display}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Time</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{time}</td>
          </tr>
        </table>
        <table style="width: 100%; margin-top: 24px;">
          <tr>
            <td style="padding-right: 8px; width: 50%;">
              <a href="{cancel_url}" style="display: block; text-align: center; background: #fee2e2; color: #b91c1c; text-decoration: none; padding: 12px 0; border-radius: 8px; font-weight: bold; font-size: 14px;">Cancel</a>
            </td>
            <td style="padding-left: 8px; width: 50%;">
              <a href="{reschedule_url}" style="display: block; text-align: center; background: #dbeafe; color: #1d4ed8; text-decoration: none; padding: 12px 0; border-radius: 8px; font-weight: bold; font-size: 14px;">Reschedule</a>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Appointment ID: {appointment_id}</p>
      </div>
    </div>
    """


def send_appointment_confirmation(
    to_email: str,
    patient_name: str,
    doctor_name: str,
    date: date_type,
    time: str,
    appointment_id: str,
    access_token: str,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Appointment confirmed with {doctor_name}"
    msg["From"] = settings.gmail_address
    msg["To"] = to_email

    html = _build_html(patient_name, doctor_name, date, time, appointment_id, access_token)
    msg.attach(MIMEText(html, "html"))


# Gmail's SMTP server directly — not the Gmail API, just plain SMTP with an app password.
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.gmail_address, settings.gmail_app_password)
        server.sendmail(settings.gmail_address, to_email, msg.as_string())



def _build_cancellation_html(
    patient_name: str,
    doctor_name: str,
    date: date_type,
    time: str,
    appointment_id: str,
) -> str:
    date_display = date.strftime("%A, %B %d, %Y")
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #b91c1c; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px;">Appointment Cancelled</h2>
      </div>
      <div style="padding: 24px; color: #111827;">
        <p style="font-size: 15px;">Hi {patient_name},</p>
        <p style="font-size: 15px;">Your appointment has been cancelled. Here are the details of the cancelled booking:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Doctor</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{doctor_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Date</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{date_display}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Time</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{time}</td>
          </tr>
        </table>
        <p style="font-size: 14px; color: #374151;">If this wasn't you, or you'd like to book a new appointment, feel free to reach out.</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Appointment ID: {appointment_id}</p>
      </div>
    </div>
    """


def send_appointment_cancellation(
    to_email: str,
    patient_name: str,
    doctor_name: str,
    date: date_type,
    time: str,
    appointment_id: str,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Appointment cancelled with {doctor_name}"
    msg["From"] = settings.gmail_address
    msg["To"] = to_email

    html = _build_cancellation_html(patient_name, doctor_name, date, time, appointment_id)
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.gmail_address, settings.gmail_app_password)
        server.sendmail(settings.gmail_address, to_email, msg.as_string())


def _build_reschedule_html(
    patient_name: str,
    doctor_name: str,
    old_date: date_type,
    old_time: str,
    new_date: date_type,
    new_time: str,
    appointment_id: str,
    access_token: str,
) -> str:
    cancel_url = f"{settings.frontend_base_url}/appointments/{appointment_id}/cancel?token={access_token}"
    reschedule_url = f"{settings.frontend_base_url}/appointments/{appointment_id}/reschedule?token={access_token}"
    old_date_display = old_date.strftime("%A, %B %d, %Y")
    new_date_display = new_date.strftime("%A, %B %d, %Y")

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #1d4ed8; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px;">Appointment Rescheduled</h2>
      </div>
      <div style="padding: 24px; color: #111827;">
        <p style="font-size: 15px;">Hi {patient_name},</p>
        <p style="font-size: 15px;">Your appointment with <strong>{doctor_name}</strong> has been moved:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Previously</td>
            <td style="padding: 8px 0; text-align: right; text-decoration: line-through; color: #9ca3af;">{old_date_display}, {old_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Now</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{new_date_display}, {new_time}</td>
          </tr>
        </table>
        <table style="width: 100%; margin-top: 24px;">
          <tr>
            <td style="padding-right: 8px; width: 50%;">
              <a href="{cancel_url}" style="display: block; text-align: center; background: #fee2e2; color: #b91c1c; text-decoration: none; padding: 12px 0; border-radius: 8px; font-weight: bold; font-size: 14px;">Cancel</a>
            </td>
            <td style="padding-left: 8px; width: 50%;">
              <a href="{reschedule_url}" style="display: block; text-align: center; background: #dbeafe; color: #1d4ed8; text-decoration: none; padding: 12px 0; border-radius: 8px; font-weight: bold; font-size: 14px;">Reschedule again</a>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">Appointment ID: {appointment_id}</p>
      </div>
    </div>
    """


def send_appointment_reschedule(
    to_email: str,
    patient_name: str,
    doctor_name: str,
    old_date: date_type,
    old_time: str,
    new_date: date_type,
    new_time: str,
    appointment_id: str,
    access_token: str,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Appointment rescheduled with {doctor_name}"
    msg["From"] = settings.gmail_address
    msg["To"] = to_email

    html = _build_reschedule_html(
        patient_name, doctor_name, old_date, old_time, new_date, new_time, appointment_id, access_token
    )
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.gmail_address, settings.gmail_app_password)
        server.sendmail(settings.gmail_address, to_email, msg.as_string())


def _build_otp_html(code: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f766e; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px;">Your verification code</h2>
      </div>
      <div style="padding: 24px; color: #111827; text-align: center;">
        <p style="font-size: 15px;">Use this code to view your appointments:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 16px 0;">{code}</p>
        <p style="font-size: 13px; color: #9ca3af;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    </div>
    """


def send_otp_email(to_email: str, code: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your verification code"
    msg["From"] = settings.gmail_address
    msg["To"] = to_email

    html = _build_otp_html(code)
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(settings.gmail_address, settings.gmail_app_password)
        server.sendmail(settings.gmail_address, to_email, msg.as_string())