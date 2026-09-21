import secrets

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app import email_service
from app.models import RequestCodeRequest, VerifyCodeRequest, VerifyCodeResponse
from app.redis_client import cache_get, cache_set, get_redis

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_TTL_SECONDS = 600       # 10 minutes to enter the code
SESSION_TTL_SECONDS = 3600  # 1 hour to browse/act on appointments once verified


@router.post("/request-code")
async def request_code(payload: RequestCodeRequest, background_tasks: BackgroundTasks):
    code = f"{secrets.randbelow(1_000_000):06d}"
    await cache_set(f"otp:{payload.email}", code, ttl_seconds=OTP_TTL_SECONDS)

    background_tasks.add_task(
        email_service.send_otp_email,
        to_email=payload.email,
        code=code,
    )
    return {"message": "Code sent"}


@router.post("/verify-code", response_model=VerifyCodeResponse)
async def verify_code(payload: VerifyCodeRequest):
    cached_code = await cache_get(f"otp:{payload.email}")
    if not cached_code or not secrets.compare_digest(str(cached_code), payload.code):
        raise HTTPException(403, "Invalid or expired code")

    session_token = secrets.token_urlsafe(32)
    await cache_set(f"otp_session:{session_token}", payload.email, ttl_seconds=SESSION_TTL_SECONDS)

    # one-time use — burn the code once it's been redeemed
    r = get_redis()
    await r.delete(f"otp:{payload.email}")

    return VerifyCodeResponse(session_token=session_token)


async def get_email_from_session(session_token: str) -> str:
    """Shared guard — imported by appointments.py's list endpoint."""
    email = await cache_get(f"otp_session:{session_token}")
    if not email:
        raise HTTPException(403, "Invalid or expired session")
    return email