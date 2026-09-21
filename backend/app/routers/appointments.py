# appointemnets.py 
import secrets
import uuid
from datetime import date as date_type

from app import google_calendar
from app.config import get_settings
from app.database import appointments_col, availability_col, doctors_col, patients_col
from app.models import (
    AppointmentListOut,
    AppointmentOut,
    AppointmentStatus,
    AvailableSlot,
    BookAppointmentRequest,
    BookAppointmentResponse,
    CancelAppointmentRequest,
    RescheduleAppointmentRequest,
)
from app.routers.auth import get_email_from_session
from app.scheduling import _generate_slots, _WEEKDAY_AR
from fastapi import APIRouter, BackgroundTasks, HTTPException
from app import email_service

router = APIRouter(prefix="/appointments", tags=["appointments"])
settings = get_settings()


async def _get_appointment_with_valid_token(appointment_id: str, access_token: str) -> dict:
    """Shared guard for cancel/reschedule/get — confirms the appointment
    exists AND the caller supplied the matching access_token (issued at
    booking time, sent only via the confirmation email). Without this,
    anyone who obtains the bare appointment_id (e.g. a forwarded email)
    could act on someone else's appointment."""
    appt = await appointments_col().find_one({"appointment_id": appointment_id})
    if not appt:
        raise HTTPException(404, "Appointment not found")
    if not secrets.compare_digest(appt.get("access_token", ""), access_token):
        raise HTTPException(403, "Invalid or missing access token")
    return appt


@router.get("/available-slots", response_model=list[AvailableSlot])
async def available_slots(doctor_id: str, date: date_type):
    day_name = _WEEKDAY_AR[date.weekday()]
    template = await availability_col().find_one(
        {"doctor_id": doctor_id, "day_name": day_name}
    )
    if not template:
        return []

    all_slots = _generate_slots(template["from_time"], template["to_time"])

    taken_cursor = appointments_col().find(
        {
            "doctor_id": doctor_id,
            "date": date.isoformat(),
            "status": AppointmentStatus.confirmed,
        },
        {"time": 1},
    )
    taken = {doc["time"] async for doc in taken_cursor}

    return [AvailableSlot(date=date, time=t) for t in all_slots if t not in taken]


@router.post("", response_model=BookAppointmentResponse)
async def book_appointment(payload: BookAppointmentRequest, background_tasks: BackgroundTasks):
    doctor = await doctors_col().find_one({"doctor_id": payload.doctor_id})
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    date_str = payload.date.isoformat()

    already_taken = await appointments_col().find_one(
        {
            "doctor_id": payload.doctor_id,
            "date": date_str,
            "time": payload.time,
            "status": AppointmentStatus.confirmed,
        }
    )
    if already_taken:
        raise HTTPException(409, "That slot is already booked. Please pick another.")

    await patients_col().update_one(
        {"email": payload.patient.email},
        {"$set": payload.patient.model_dump()},
        upsert=True,
    )

    google_event_id = google_calendar.create_event(
        doctor_id=payload.doctor_id,
        doctor_name=doctor["name"],
        patient_name=payload.patient.name,
        patient_email=payload.patient.email,
        patient_phone=payload.patient.phone,
        date=payload.date,
        time_str=payload.time,
    )

    appointment_id = str(uuid.uuid4())
    access_token = secrets.token_urlsafe(32)

    await appointments_col().insert_one(
        {
            "appointment_id": appointment_id,
            "access_token": access_token,
            "doctor_id": payload.doctor_id,
            "patient_email": payload.patient.email,
            "patient_name": payload.patient.name,
            "patient_phone": payload.patient.phone,
            "date": date_str,
            "time": payload.time,
            "google_event_id": google_event_id,
            "status": AppointmentStatus.confirmed,
        }
    )

    background_tasks.add_task(
        email_service.send_appointment_confirmation,
        to_email=payload.patient.email,
        patient_name=payload.patient.name,
        doctor_name=doctor["name"],
        date=payload.date,
        time=payload.time,
        appointment_id=appointment_id,
        access_token=access_token,
    )

    return BookAppointmentResponse(
        appointment_id=appointment_id,
        google_event_id=google_event_id,
        doctor_id=payload.doctor_id,
        date=payload.date,
        time=payload.time,
        status=AppointmentStatus.confirmed,
    )


@router.get("/available-slots", response_model=list[AvailableSlot])


@router.get("/{appointment_id}", response_model=AppointmentOut)
async def get_appointment(appointment_id: str, token: str):
    """Used by the Cancel/Reschedule pages to show current booking details
    before the patient confirms an action."""
    appt = await _get_appointment_with_valid_token(appointment_id, token)
    doctor = await doctors_col().find_one({"doctor_id": appt["doctor_id"]})

    return AppointmentOut(
        appointment_id=appt["appointment_id"],
        doctor_id=appt["doctor_id"],
        doctor_name=doctor["name"] if doctor else "Unknown",
        patient_name=appt["patient_name"],
        date=appt["date"],
        time=appt["time"],
        status=appt["status"],
    )


@router.post("/cancel", response_model=dict)
async def cancel_appointment(payload: CancelAppointmentRequest, background_tasks: BackgroundTasks):
    appt = await _get_appointment_with_valid_token(payload.appointment_id, payload.access_token)
    if appt["status"] == AppointmentStatus.cancelled:
        raise HTTPException(400, "Appointment already cancelled")

    doctor = await doctors_col().find_one({"doctor_id": appt["doctor_id"]})

    google_calendar.delete_event(appt["google_event_id"])

    await appointments_col().update_one(
        {"appointment_id": payload.appointment_id},
        {"$set": {"status": AppointmentStatus.cancelled, "cancel_reason": payload.reason}},
    )

    background_tasks.add_task(
        email_service.send_appointment_cancellation,
        to_email=appt["patient_email"],
        patient_name=appt["patient_name"],
        doctor_name=doctor["name"] if doctor else "your doctor",
        date=date_type.fromisoformat(appt["date"]),
        time=appt["time"],
        appointment_id=appt["appointment_id"],
    )

    return {"appointment_id": payload.appointment_id, "status": "cancelled"}


@router.post("/reschedule", response_model=BookAppointmentResponse)
async def reschedule_appointment(payload: RescheduleAppointmentRequest, background_tasks: BackgroundTasks):
    appt = await _get_appointment_with_valid_token(payload.appointment_id, payload.access_token)
    if appt["status"] != AppointmentStatus.confirmed:
        raise HTTPException(400, f"Cannot reschedule an appointment with status '{appt['status']}'")

    new_date_str = payload.new_date.isoformat()
    clash = await appointments_col().find_one(
        {
            "doctor_id": appt["doctor_id"],
            "date": new_date_str,
            "time": payload.new_time,
            "status": AppointmentStatus.confirmed,
        }
    )
    if clash:
        raise HTTPException(409, "That new slot is already taken. Please pick another.")

    old_date = date_type.fromisoformat(appt["date"])
    old_time = appt["time"]
    doctor = await doctors_col().find_one({"doctor_id": appt["doctor_id"]})

    google_calendar.update_event_time(
        appt["google_event_id"], payload.new_date, payload.new_time
    )

    await appointments_col().update_one(
        {"appointment_id": payload.appointment_id},
        {"$set": {"date": new_date_str, "time": payload.new_time}},
    )

    background_tasks.add_task(
        email_service.send_appointment_reschedule,
        to_email=appt["patient_email"],
        patient_name=appt["patient_name"],
        doctor_name=doctor["name"] if doctor else "your doctor",
        old_date=old_date,
        old_time=old_time,
        new_date=payload.new_date,
        new_time=payload.new_time,
        appointment_id=appt["appointment_id"],
        access_token=appt.get("access_token", ""),
    )

    return BookAppointmentResponse(
        appointment_id=appt["appointment_id"],
        google_event_id=appt["google_event_id"],
        doctor_id=appt["doctor_id"],
        date=payload.new_date,
        time=payload.new_time,
        status=AppointmentStatus.confirmed,
    )


@router.get("", response_model=list[AppointmentListOut])
async def list_appointments(patient_email: str, session_token: str):
    """Backs the My Appointments page. Requires a verified OTP session
    (see routers/auth.py) that matches the requested email — someone can't
    just pass an arbitrary patient_email even with a valid session_token
    for a different address."""
    verified_email = await get_email_from_session(session_token)
    if not secrets.compare_digest(verified_email, patient_email):
        raise HTTPException(403, "Session does not match this email")

    results: list[AppointmentListOut] = []
    cursor = appointments_col().find({"patient_email": patient_email}).sort("date", -1)
    async for appt in cursor:
        doctor = await doctors_col().find_one({"doctor_id": appt["doctor_id"]})
        results.append(
            AppointmentListOut(
                appointment_id=appt["appointment_id"],
                doctor_id=appt["doctor_id"],
                doctor_name=doctor["name"] if doctor else "Unknown",
                patient_name=appt["patient_name"],
                date=appt["date"],
                time=appt["time"],
                status=appt["status"],
                access_token=appt.get("access_token", ""),
            )
        )
    return results