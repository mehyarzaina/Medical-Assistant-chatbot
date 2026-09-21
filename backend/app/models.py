# models.py
from datetime import date as date_type
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AppointmentStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    rescheduled = "rescheduled"
    completed = "completed"


# ---------- Patient / contact info collected at booking time ----------

class PatientInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    notes: Optional[str] = None  # e.g. symptoms, free text from the chatbot turn


# ---------- Doctor recommendation ----------


class DoctorOut(BaseModel):
    doctor_id: str
    name: str
    specialty: str
    location: Optional[str] = None
    phone: Optional[str] = None
    about: Optional[str] = None
    profile_url: Optional[str] = None


# ---------- Availability ----------

class AvailableSlot(BaseModel):
    date: date_type
    time: str  # "10:00 AM" style, matches from_time/to_time granularity


# ---------- Appointments ----------

class BookAppointmentRequest(BaseModel):
    doctor_id: str
    date: date_type
    time: str  # must be one of the slots returned by /doctors/{id}/availability
    patient: PatientInfo


class BookAppointmentResponse(BaseModel):
    appointment_id: str
    google_event_id: str
    doctor_id: str
    date: date_type
    time: str
    status: AppointmentStatus


# ---------- Insurance ----------

class DoctorInsuranceResponse(BaseModel):
    doctor_id: str
    doctor_name: str
    insurance_companies: list[str]


class InsuranceSearchResponse(BaseModel):
    insurance_company: str
    specialty: Optional[str]
    doctors: list[DoctorOut]


class DoctorRecommendRequest(BaseModel):
    query: str = Field(..., description="Patient's free-text message, Arabic or English")
    top_k: int = 3
    days_ahead: int = 7  # how many days out to pull availability for


class AvailabilityDay(BaseModel):
    date: date_type
    times: list[str]


class DoctorRecommendationOut(BaseModel):
    doctor_id: str
    name: str
    specialty: str
    location: Optional[str] = None
    phone: Optional[str] = None
    about: Optional[str] = None
    profile_url: Optional[str] = None
    match_score: float
    matched_text: str
    upcoming_availability: list[AvailabilityDay]


class DoctorRecommendResponse(BaseModel):
    doctors: list[DoctorRecommendationOut]

class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    doctors: list[DoctorRecommendationOut] = []



class CancelAppointmentRequest(BaseModel):
    appointment_id: str
    access_token: str
    reason: str | None = None


class RescheduleAppointmentRequest(BaseModel):
    appointment_id: str
    access_token: str
    new_date: date_type
    new_time: str


class AppointmentOut(BaseModel):
    appointment_id: str
    doctor_id: str
    doctor_name: str
    patient_name: str
    date: date_type
    time: str
    status: AppointmentStatus


class RequestCodeRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class VerifyCodeResponse(BaseModel):
    session_token: str


class AppointmentListOut(AppointmentOut):
    access_token: str  # lets the frontend link directly to your existing Cancel/Reschedule pages



class DoctorAvailabilityDay(BaseModel):
    day_name: str
    from_time: str
    to_time: str

class DoctorAvailabilityResponse(BaseModel):
    doctor_id: str
    schedule: list[DoctorAvailabilityDay]