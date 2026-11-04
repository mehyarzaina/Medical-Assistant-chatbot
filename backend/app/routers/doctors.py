# doctors.py
from collections import defaultdict
from datetime import date as date_type, timedelta

from fastapi import APIRouter, HTTPException
import re

from app.database import (
    appointments_col,
    availability_col,
    doctor_insurance_col,
    doctors_col,
    insurance_companies_col,
)
from app.gemini_service import recommend_doctors
from app.models import (
    AppointmentStatus,
    AvailabilityDay,
    DoctorInsuranceResponse,
    DoctorOut,
    DoctorRecommendationOut,
    DoctorRecommendRequest,
    DoctorRecommendResponse,
)
from app.scheduling import day_name_query, normalize_day_name, open_slots, _WEEKDAY_AR

from app.models import (
    AppointmentStatus,
    AvailabilityDay,
    DoctorAvailabilityDay,
    DoctorAvailabilityResponse,
    DoctorInsuranceResponse,
    DoctorOut,
    DoctorRecommendationOut,
    DoctorRecommendRequest,
    DoctorRecommendResponse,
)

router = APIRouter(prefix="/doctors", tags=["doctors"])


async def enrich_doctor_matches(
    matches: list[dict], days_ahead: int = 5
) -> list[DoctorRecommendationOut]:
    """Turns raw Zilliz matches into DoctorRecommendationOut with real
    upcoming availability pulled from Mongo. Shared by /doctors/recommend
    and the chat endpoint so both return doctors in the same shape."""
    today = date_type.today()
    enriched: list[DoctorRecommendationOut] = []

    for m in matches:
        doctor = await doctors_col().find_one({"doctor_id": m["doctor_id"]})
        if not doctor:
            continue

        upcoming: list[AvailabilityDay] = []
        for i in range(days_ahead):
            d = today + timedelta(days=i)
            template = await availability_col().find_one(
                {"doctor_id": m["doctor_id"], "day_name": day_name_query(d.weekday())}
            )
            if not template:
                continue

            taken = {
                doc["time"]
                async for doc in appointments_col().find(
                    {
                        "doctor_id": m["doctor_id"],
                        "date": d.isoformat(),
                        "status": AppointmentStatus.confirmed,
                    },
                    {"time": 1},
                )
            }
            times = open_slots(template["from_time"], template["to_time"], taken, d)
            if times:
                upcoming.append(AvailabilityDay(date=d, times=times))

        enriched.append(
            DoctorRecommendationOut(
                doctor_id=doctor["doctor_id"],
                name=doctor["name"],
                specialty=doctor.get("specialty", ""),
                location=doctor.get("location"),
                phone=doctor.get("phone"),
                about=doctor.get("about"),
                profile_url=doctor.get("profile_url"),
                match_score=m["score"],
                matched_text=m["matched_text"],
                upcoming_availability=upcoming,
            )
        )
    return enriched


@router.post("/recommend", response_model=DoctorRecommendResponse)
async def recommend(payload: DoctorRecommendRequest):
    """
    Semantic doctor recommendation via Zilliz RAG search (app/rag_search.py).
    """
    matches = await recommend_doctors(payload.query, top_k=payload.top_k)
    if not matches:
        raise HTTPException(404, "No matching doctors found")

    enriched = await enrich_doctor_matches(matches, payload.days_ahead)
    return DoctorRecommendResponse(doctors=enriched)


@router.get("/{doctor_id}/insurance", response_model=DoctorInsuranceResponse)
async def doctor_insurance(doctor_id: str):
    doctor = await doctors_col().find_one({"doctor_id": doctor_id})
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    link_cursor = doctor_insurance_col().find({"doctor_id": doctor_id})
    insurance_ids = [link["insurance_id"] async for link in link_cursor]

    companies_cursor = insurance_companies_col().find({"id": {"$in": insurance_ids}})
    company_names = [c["name"] async for c in companies_cursor]

    return DoctorInsuranceResponse(
        doctor_id=doctor_id,
        doctor_name=doctor["name"],
        insurance_companies=company_names,
    )


@router.get("/{doctor_id}", response_model=DoctorOut)
async def get_doctor(doctor_id: str):
    doctor = await doctors_col().find_one({"doctor_id": doctor_id})
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    return DoctorOut(**doctor)


from fastapi import APIRouter, HTTPException, Query
# (add Query to your existing fastapi import)

async def doctors_with_open_slots(days: int) -> set[str]:
    """IDs of doctors with at least one bookable slot from today through the
    next `days` days. Two queries in total (all weekly hours, and confirmed
    bookings in the window), then the slot maths in memory."""
    today = date_type.today()
    last = today + timedelta(days=days - 1)

    hours: dict[str, dict[str, dict]] = defaultdict(dict)
    async for t in availability_col().find(
        {}, {"_id": 0, "doctor_id": 1, "day_name": 1, "from_time": 1, "to_time": 1}
    ):
        hours[t["doctor_id"]][normalize_day_name(t["day_name"])] = t

    taken: dict[tuple[str, str], set[str]] = defaultdict(set)
    async for a in appointments_col().find(
        {
            "date": {"$gte": today.isoformat(), "$lte": last.isoformat()},
            "status": AppointmentStatus.confirmed,
        },
        {"_id": 0, "doctor_id": 1, "date": 1, "time": 1},
    ):
        taken[(a["doctor_id"], a["date"])].add(a["time"])

    available: set[str] = set()
    for doctor_id, week in hours.items():
        for i in range(days):
            d = today + timedelta(days=i)
            template = week.get(normalize_day_name(_WEEKDAY_AR[d.weekday()]))
            if not template:
                continue
            try:
                times = open_slots(
                    template["from_time"], template["to_time"], taken[(doctor_id, d.isoformat())], d
                )
            except ValueError:  # malformed hours in the source data
                continue
            if times:
                available.add(doctor_id)
                break
    return available


@router.get("", response_model=list[DoctorOut])
async def list_doctors(
    specialty: list[str] | None = Query(None),
    location: list[str] | None = Query(None),
    insurance: list[str] | None = Query(None),
    available_within: int | None = Query(None, ge=1, le=30),
):
    """
    Browsable doctor directory for the frontend Doctors tab.
    Each filter accepts multiple values (checkbox-style). Within a single
    filter, selections are OR'd (e.g. ticking two specialties returns
    doctors matching either). Across different filters, results are AND'd
    (specialty AND location AND insurance must all match) — that's normal
    faceted-search behavior, not the same thing the OR fix targets.
    `location` values are now city names (e.g. "Amman"); doctors are
    matched by whether their stored "City, Country" location starts with
    that city.
    """
    query: dict = {}

    if specialty:
        query["specialty"] = {"$in": specialty}

    if location:
        query["$or"] = [
            {"location": {"$regex": f"^{re.escape(city)}", "$options": "i"}}
            for city in location
        ]

    if insurance:
        companies_cursor = insurance_companies_col().find({"name": {"$in": insurance}})
        company_ids = [c["id"] async for c in companies_cursor]
        link_cursor = doctor_insurance_col().find({"insurance_id": {"$in": company_ids}})
        doctor_ids = {link["doctor_id"] async for link in link_cursor}
        query["doctor_id"] = {"$in": list(doctor_ids)}

    # Only doctors with an open slot in the next `available_within` days.
    if available_within:
        open_ids = await doctors_with_open_slots(available_within)
        if "doctor_id" in query:
            open_ids &= set(query["doctor_id"]["$in"])
        query["doctor_id"] = {"$in": list(open_ids)}

    cursor = doctors_col().find(query)
    return [DoctorOut(**doc) async for doc in cursor]


@router.get("/{doctor_id}/availability", response_model=DoctorAvailabilityResponse)
async def doctor_availability(doctor_id: str):
    """Recurring weekly schedule (not live open slots) — used for the
    'See more' / profile view so patients can see general working days
    without picking a date first."""
    doctor = await doctors_col().find_one({"doctor_id": doctor_id})
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    cursor = availability_col().find({"doctor_id": doctor_id}).sort("day_order", 1)
    schedule = [
        DoctorAvailabilityDay(
            day_name=doc["day_name"],
            from_time=doc["from_time"],
            to_time=doc["to_time"],
        )
        async for doc in cursor
    ]
    return DoctorAvailabilityResponse(doctor_id=doctor_id, schedule=schedule)