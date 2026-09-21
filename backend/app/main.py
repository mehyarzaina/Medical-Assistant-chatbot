from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import ensure_indexes
from app.routers import appointments, chat, doctors, insurance, auth
from app.routers import admin, admin_auth

# creates API application
app = FastAPI(
    title="Zaina Medical — Booking API",
    description=(
        "Doctor recommendation + appointment booking, backed by MongoDB "
        "(source of truth for availability/appointments) and a personal "
        "Google Calendar (display log of confirmed bookings)."
    ),
    version="1.0.0",
)

# frontend and backend are running on different addresses during development so CORS allows both to run at the same  time
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"], # accepts all methods (get, post, put, etc..) from backend
    allow_headers=["*"], # This allows requests from frontend to contain any HTTP headers.
)

# Add all the endpoints defined in router to my app.
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(insurance.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(admin_auth.router)
app.include_router(admin.router)



@app.on_event("startup")
async def on_startup():
    await ensure_indexes()


@app.get("/health")
async def health():
    return {"status": "ok"}