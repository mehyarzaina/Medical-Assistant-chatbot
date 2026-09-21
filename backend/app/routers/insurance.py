# insurance.py
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.database import doctor_insurance_col, doctors_col, insurance_companies_col
from app.models import DoctorOut, InsuranceSearchResponse

router = APIRouter(prefix="/insurance", tags=["insurance"])


@router.get("/{company}/doctors", response_model=InsuranceSearchResponse)
async def doctors_by_insurance(company: str, specialty: Optional[str] = None):
    """Doctors accepting a given insurance company (matched by name, case-
    insensitive), optionally narrowed by specialty.

    Join path: insurance_companies.name -> id -> doctor_insurance.insurance_id
    -> doctor_id -> doctors.
    """
    company_doc = await insurance_companies_col().find_one(
        {"name": {"$regex": f"^{company}$", "$options": "i"}}
    )
    if not company_doc:
        raise HTTPException(404, f"No insurance company matching '{company}'")

    link_cursor = doctor_insurance_col().find({"insurance_id": company_doc["id"]})
    doctor_ids = [link["doctor_id"] async for link in link_cursor]

    doctor_query: dict = {"doctor_id": {"$in": doctor_ids}}
    if specialty:
        doctor_query["specialty"] = {"$regex": f"^{specialty}$", "$options": "i"}

    doctors_cursor = doctors_col().find(doctor_query)
    doctors = [DoctorOut(**doc) async for doc in doctors_cursor]

    return InsuranceSearchResponse(
        insurance_company=company_doc["name"], specialty=specialty, doctors=doctors
    )


@router.get("", response_model=list[str])
async def list_insurance_companies():
    cursor = insurance_companies_col().find({}, {"name": 1})
    return [doc["name"] async for doc in cursor]