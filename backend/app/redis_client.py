"""
Redis's only job in this app: 
caching specialty-matching results so identical patient queries don't re-hit the API.
Temporarily storing chat history for a session
"""

import json

import redis.asyncio as redis

from app.config import get_settings

settings = get_settings()

_redis: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def cache_get(key: str):
    r = get_redis()
    val = await r.get(key)
    return json.loads(val) if val else None


async def cache_set(key: str, value, ttl_seconds: int = 3600):
    r = get_redis()
    await r.set(key, json.dumps(value), ex=ttl_seconds)
