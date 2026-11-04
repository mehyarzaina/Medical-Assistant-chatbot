import re
from collections import Counter, defaultdict

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


def _hour_of(time_str: str) -> int | None:
    """'11:00 AM' / '13:30' -> 13-style hour, or None if unparseable."""
    match = re.match(r"\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?", time_str or "")
    if not match:
        return None
    hour = int(match.group(1)) % 12 if match.group(3) else int(match.group(1))
    if match.group(3) and match.group(3).lower() == "pm":
        hour += 12
    return hour


def _top(counter: Counter, limit: int) -> list[dict]:
    """Largest `limit` entries; everything past them folds into one 'Other' row."""
    ranked = counter.most_common()
    rows = [{"label": label, "count": count} for label, count in ranked[:limit]]
    rest = sum(count for _, count in ranked[limit:])
    if rest:
        rows.append({"label": "Other", "count": rest})
    return rows


@router.get("/stats/charts")
async def dashboard_charts(
    date_from: date_type | None = None,
    date_to: date_type | None = None,
):
    """Breakdowns for the dashboard charts. Appointment charts honour the date
    range; doctor charts always cover the whole directory."""
    appt_query: dict = {}
    if date_from or date_to:
        appt_query["date"] = {}
        if date_from:
            appt_query["date"]["$gte"] = date_from.isoformat()
        if date_to:
            appt_query["date"]["$lte"] = date_to.isoformat()

    doctors = await doctors_col().find(
        {}, {"_id": 0, "doctor_id": 1, "specialty": 1, "location": 1}
    ).to_list(None)
    specialty_of = {d["doctor_id"]: d.get("specialty") or "Unknown" for d in doctors}

    appointments = await appointments_col().find(
        appt_query, {"_id": 0, "doctor_id": 1, "date": 1, "time": 1, "status": 1}
    ).to_list(None)

    by_date: dict[str, Counter] = defaultdict(Counter)
    by_status: Counter = Counter()
    by_specialty: Counter = Counter()
    by_hour: Counter = Counter()
    for appt in appointments:
        status = str(appt.get("status", "confirmed"))
        by_date[str(appt.get("date"))][status] += 1
        by_status[status] += 1
        by_specialty[specialty_of.get(appt.get("doctor_id"), "Unknown")] += 1
        hour = _hour_of(appt.get("time", ""))
        if hour is not None:
            by_hour[hour] += 1

    cities = Counter(
        re.split(r"[,،]", d.get("location") or "")[0].strip() or "Unknown" for d in doctors
    )

    return {
        "appointments_by_date": [
            {"date": day, **counts} for day, counts in sorted(by_date.items())
        ],
        "appointments_by_status": dict(by_status),
        "appointments_by_specialty": _top(by_specialty, 6),
        "appointments_by_hour": [
            {"hour": hour, "count": count} for hour, count in sorted(by_hour.items())
        ],
        "doctors_by_specialty": _top(Counter(specialty_of.values()), 10),
        "doctors_by_city": _top(cities, 8),
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
    appointments = [doc async for doc in cursor]
    # Show who the appointment is with, not just an ID.
    doctor_ids = list({a["doctor_id"] for a in appointments if a.get("doctor_id")})
    names = {
        d["doctor_id"]: d.get("name")
        async for d in doctors_col().find({"doctor_id": {"$in": doctor_ids}}, {"_id": 0, "doctor_id": 1, "name": 1})
    }
    for appt in appointments:
        appt["doctor_name"] = names.get(appt.get("doctor_id"))
    return appointments


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