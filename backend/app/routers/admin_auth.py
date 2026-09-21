import hashlib
import hmac
import secrets

from fastapi import APIRouter, Header, HTTPException

from app.config import get_settings
from app.redis_client import cache_get, cache_set

router = APIRouter(prefix="/admin/auth", tags=["admin"])
settings = get_settings()

ADMIN_SESSION_TTL_SECONDS = 3600 * 8  # 8 hours


class AdminLoginRequest:
    def __init__(self, password: str):
        self.password = password


from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    session_token: str


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest):
    if not settings.admin_password:
        raise HTTPException(500, "Admin password not configured on server")

    if not hmac.compare_digest(payload.password, settings.admin_password):
        raise HTTPException(403, "Incorrect password")

    session_token = secrets.token_urlsafe(32)
    await cache_set(f"admin_session:{session_token}", "ok", ttl_seconds=ADMIN_SESSION_TTL_SECONDS)
    return AdminLoginResponse(session_token=session_token)


async def require_admin(x_admin_token: str = Header(...)) -> None:
    """Dependency — attach to every admin router with `dependencies=[Depends(require_admin)]`."""
    valid = await cache_get(f"admin_session:{x_admin_token}")
    if not valid:
        raise HTTPException(403, "Invalid or expired admin session")