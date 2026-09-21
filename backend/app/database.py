# database.py

"""
Async MongoDB access via Motor.

Collections in the `altibbi_dr` database (matches what's already in Atlas):

- doctors              -> structured doctor profiles (mirrors what's in Zilliz,
                           but with queryable fields, esp. `specialty`)
- doctor_availability  -> recurring weekly template
                           { doctor_id, day_name, day_order, from_time, to_time }
- doctor_insurance     -> junction table { doctor_id, insurance_id }
- insurance_companies  -> { id, name }
- appointments         -> NEW — source of truth for bookings made through this API
- patients             -> NEW — upserted by email on each booking
"""

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings

settings = get_settings()

_client: AsyncIOMotorClient | None = None


import certifi
from motor.motor_asyncio import AsyncIOMotorClient

def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.mongo_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,  # fail fast for debugging
        )
    return _client


def get_db():
    return get_client()[settings.mongo_db_name]


def doctors_col():
    return get_db()["doctors"]


def availability_col():
    return get_db()["doctor_availability"]


def appointments_col():
    return get_db()["appointments"]


def patients_col():
    return get_db()["patients"]


def doctor_insurance_col():
    return get_db()["doctor_insurance"]


def insurance_companies_col():
    return get_db()["insurance_companies"]

# Setting up smart indexes in MongoDB so the database can find information faster and enforce certain rules.
async def ensure_indexes():
    """Call once on startup. Keeps lookups fast and prevents double-booking."""
    await availability_col().create_index(["doctor_id", "day_name"])
    await appointments_col().create_index("google_event_id", unique=True, sparse=True)
    await appointments_col().create_index(["doctor_id", "date", "time"]) 
    await doctors_col().create_index("doctor_id", unique=True)
    await patients_col().create_index("email")
    await patients_col().create_index("phone")
    await doctor_insurance_col().create_index("doctor_id")
    await doctor_insurance_col().create_index("insurance_id")
    await insurance_companies_col().create_index("id", unique=True)

# MongoDB may have to examine many documents. With an index: -> email index: zaina@example.com -> Patient 73,421