# google_calender.py
"""
Wraps the personal Gmail calendar as a *display log* of confirmed bookings.

Design choice (matches what you sketched): the calendar is never read to
decide availability — Mongo's doctor_availability + appointments collections
are the only source of truth for that. This module only ever writes/updates/
deletes single events, tagged with doctor_id in extendedProperties so many
doctors' events can share one calendar without collisions.

Auth: this uses a one-time OAuth flow against *your* personal Google account
(installed-app flow), since the requirement is "calendar Gmail personal" —
not per-patient OAuth. Run `python -m app.google_calendar` once locally to
generate token.json, then deploy that token file (or its refresh token)
alongside the service.
"""

from __future__ import annotations

import datetime as dt
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from app.config import get_settings

settings = get_settings()

SCOPES = ["https://www.googleapis.com/auth/calendar"]

# gives full calendar read/write access
def _get_credentials() -> Credentials:
    creds: Optional[Credentials] = None
    try:
        creds = Credentials.from_authorized_user_file(settings.google_token_path, SCOPES)
    except FileNotFoundError:
        pass

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                settings.google_credentials_path, SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open(settings.google_token_path, "w") as f:
            f.write(creds.to_json())
    return creds


def _service():
    return build("calendar", "v3", credentials=_get_credentials())


def _to_rfc3339(date: dt.date, time_str: str) -> dt.datetime:
    """time_str like '10:00 AM' -> combined tz-naive datetime (calendar API
    call below attaches the timezone)."""
    parsed = dt.datetime.strptime(time_str.strip(), "%I:%M %p").time()
    return dt.datetime.combine(date, parsed)

# Converts app stored date + time_str (like "10:00 AM") into Python datetime the Calendar API can use.
def create_event(
    *,
    doctor_id: str,
    doctor_name: str,
    patient_name: str,
    patient_email: str,
    patient_phone: str,
    date: dt.date,
    time_str: str,
    timezone: str = "Asia/Amman",
) -> str:
    """Creates the calendar event and returns its google_event_id."""
    start = _to_rfc3339(date, time_str)
    end = start + dt.timedelta(minutes=settings.appointment_duration_minutes)

    service = _service()
    event = {
        "summary": f"{doctor_name} — {patient_name}",
        "description": (
            f"Patient: {patient_name}\nEmail: {patient_email}\nPhone: {patient_phone}"
        ),
        "start": {"dateTime": start.isoformat(), "timeZone": timezone},
        "end": {"dateTime": end.isoformat(), "timeZone": timezone},
        "extendedProperties": {
            "private": {
                "doctor_id": doctor_id,
                "patient_email": patient_email,
            }
        },
    }
    created = service.events().insert(
        calendarId=settings.google_calendar_id, body=event
    ).execute()
    return created["id"]


def update_event_time(google_event_id: str, date: dt.date, time_str: str, timezone: str = "Asia/Amman") -> None:
    service = _service()
    start = _to_rfc3339(date, time_str)
    end = start + dt.timedelta(minutes=settings.appointment_duration_minutes)
    service.events().patch(
        calendarId=settings.google_calendar_id,
        eventId=google_event_id,
        body={
            "start": {"dateTime": start.isoformat(), "timeZone": timezone},
            "end": {"dateTime": end.isoformat(), "timeZone": timezone},
        },
    ).execute()


def delete_event(google_event_id: str) -> None:
    service = _service()
    service.events().delete(
        calendarId=settings.google_calendar_id, eventId=google_event_id
    ).execute()


if __name__ == "__main__":
    # One-time local run to produce token.json before deploying.
    _get_credentials()
    print("Google Calendar auth complete — token saved to", settings.google_token_path)
