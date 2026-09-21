from fastapi import APIRouter, Depends, HTTPException

from app.database import (
    appointments_col,
    availability_col,
    doctor_insurance_col,
    doctors_col,
    insurance_companies_col,
    patients_col,
)
from app.models import AppointmentStatus
from app.routers.admin_auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


from datetime import date as date_type

@router.get("/stats")
async def dashboard_stats(
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    doctor_id: str | None = None,
):
    appt_query: dict = {}
    if date_from or date_to:
        date_range: dict = {}
        if date_from:
            date_range["$gte"] = date_from.isoformat()
        if date_to:
            date_range["$lte"] = date_to.isoformat()
        appt_query["date"] = date_range
    if doctor_id:
        appt_query["doctor_id"] = doctor_id

    total_doctors = await doctors_col().count_documents({})
    total_appointments = await appointments_col().count_documents(appt_query)
    confirmed_upcoming = await appointments_col().count_documents(
        {**appt_query, "status": AppointmentStatus.confirmed}
    )
    cancelled = await appointments_col().count_documents(
        {**appt_query, "status": AppointmentStatus.cancelled}
    )
    total_patients = await patients_col().count_documents({})
    return {
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "confirmed_upcoming": confirmed_upcoming,
        "cancelled": cancelled,
        "total_patients": total_patients,
    }


# ---------- Doctors CRUD ----------

@router.post("/doctors")
async def create_doctor(doctor: dict):
    """NOTE: doctor bio/about should also be pushed to Zilliz so semantic
    search picks up new doctors — needs rag_search.py to implement that part."""
    existing = await doctors_col().find_one({"doctor_id": doctor["doctor_id"]})
    if existing:
        raise HTTPException(409, "doctor_id already exists")
    await doctors_col().insert_one(doctor)
    return {"status": "created", "doctor_id": doctor["doctor_id"]}


@router.put("/doctors/{doctor_id}")
async def update_doctor(doctor_id: str, updates: dict):
    result = await doctors_col().update_one({"doctor_id": doctor_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Doctor not found")
    return {"status": "updated"}


@router.delete("/doctors/{doctor_id}")
async def delete_doctor(doctor_id: str):
    result = await doctors_col().delete_one({"doctor_id": doctor_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Doctor not found")
    return {"status": "deleted"}


# ---------- Availability ----------

@router.put("/doctors/{doctor_id}/availability/{day_name}")
async def set_availability(doctor_id: str, day_name: str, from_time: str, to_time: str):
    await availability_col().update_one(
        {"doctor_id": doctor_id, "day_name": day_name},
        {"$set": {"from_time": from_time, "to_time": to_time}},
        upsert=True,
    )
    return {"status": "updated"}


# ---------- Appointments ----------

@router.get("/appointments")
async def list_all_appointments(status: str | None = None, doctor_id: str | None = None):
    query: dict = {}
    if status:
        query["status"] = status
    if doctor_id:
        query["doctor_id"] = doctor_id
    cursor = appointments_col().find(query, {"_id": 0}).sort("date", -1)
    return [doc async for doc in cursor]


# Cancel/reschedule reuse the exact same functions in appointments.py —
# see the note below on wiring this up.


# ---------- Patients ----------

@router.get("/patients")
async def list_patients():
    cursor = patients_col().find({}, {"_id": 0})
    return [doc async for doc in cursor]


# ---------- Insurance ----------

@router.post("/insurance")
async def create_insurance_company(name: str):
    existing = await insurance_companies_col().find_one({"name": name})
    if existing:
        raise HTTPException(409, "Already exists")
    new_id = str(await insurance_companies_col().count_documents({}) + 1)
    await insurance_companies_col().insert_one({"id": new_id, "name": name})
    return {"status": "created", "id": new_id}


@router.put("/doctors/{doctor_id}/insurance")
async def set_doctor_insurance(doctor_id: str, insurance_ids: list[str]):
    await doctor_insurance_col().delete_many({"doctor_id": doctor_id})
    if insurance_ids:
        await doctor_insurance_col().insert_many(
            [{"doctor_id": doctor_id, "insurance_id": iid} for iid in insurance_ids]
        )
    return {"status": "updated"}


@router.get("/specialties")
async def list_specialties():
    """Distinct specialty values, for the Doctors filter dropdown."""
    specialties = await doctors_col().distinct("specialty")
    return sorted(s for s in specialties if s)