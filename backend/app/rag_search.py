"""
app/rag_search.py

Query-time RAG search against the altibbi_doctors Zilliz collection.

Your ingestion script (Dr_RAG) already embedded chunks of each doctor's
profile text into Zilliz. This module is the missing query-time half:
embed the patient's free-text question with the SAME embedding API used
at ingestion, search Zilliz for the closest chunks, then aggregate hits
by doctor_id (each doctor has multiple chunks, so raw search results are
chunk-level, not doctor-level) into a ranked, deduplicated doctor list.

This replaces specialty-picklist matching in gemini_service.py — the bot
now matches on what's actually written in the doctor's profile/bio text,
not a rigid category the patient has to phrase correctly.
"""

from functools import lru_cache

import requests
from pymilvus import Collection, connections

from app.config import get_settings

settings = get_settings()

_connected = False


def _ensure_connection() -> None:
    global _connected
    if not _connected:
        connections.connect(uri=settings.zilliz_uri, token=settings.zilliz_token)
        _connected = True


@lru_cache(maxsize=1)
def _get_collection() -> Collection:
    """Cached so we don't reconnect/reload on every request. If you ever
    run this under multiple worker processes, each worker gets its own
    cached connection, which is fine — Zilliz Cloud handles concurrent
    clients."""
    _ensure_connection()
    col = Collection(settings.dr_collection_name)
    col.load()
    return col


def embed_query(text: str) -> list[float]:
    """Embeds a single query string via the same embedding API used at
    ingestion time. Must stay identical to Dr_RAG's payload shape or the
    vectors won't be comparable."""
    headers = {
        "Authorization": settings.embedding_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "docs": [text],
        "dense_weight": 1.0,
        "sparse_weight": 0.0,
        "convert_to_float32": True,
        "normalize_vectors": False,
        "batch_size": 1,
    }
    resp = requests.post(settings.embedding_url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()["embeddings"][0]


def search_doctors(query: str, top_k_chunks: int = 20, top_k_doctors: int = 3) -> list[dict]:
    """
    Returns up to `top_k_doctors` unique doctors ranked by their single
    best-matching chunk, e.g.:

    [{"doctor_id": "96478", "name": "...", "specialty": "...",
      "location": "...", "url": "...", "score": 0.83,
      "matched_text": "<the chunk that matched>"}]

    top_k_chunks controls how many raw chunk hits we pull before
    deduplicating by doctor — keep this higher than top_k_doctors since
    several top chunks often belong to the same doctor.
    """
    col = _get_collection()
    query_vec = embed_query(query)

    results = col.search(
        data=[query_vec],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {}},
        limit=top_k_chunks,
        output_fields=["doctor_id", "name", "specialty", "location", "url", "text"],
    )

    best_per_doctor: dict[str, dict] = {}
    for hit in results[0]:
        doctor_id = hit.entity.get("doctor_id")
        score = hit.distance  # COSINE similarity — higher is better
        existing = best_per_doctor.get(doctor_id)
        if existing is None or score > existing["score"]:
            best_per_doctor[doctor_id] = {
                "doctor_id": doctor_id,
                "name": hit.entity.get("name"),
                "specialty": hit.entity.get("specialty"),
                "location": hit.entity.get("location"),
                "url": hit.entity.get("url"),
                "score": score,
                "matched_text": hit.entity.get("text"),
            }

    ranked = sorted(best_per_doctor.values(), key=lambda d: d["score"], reverse=True)
    return ranked[:top_k_doctors]


# rag_search.py — add below search_doctors

@lru_cache(maxsize=1)
def _get_articles_collection() -> Collection:
    _ensure_connection()
    col = Collection(settings.articles_collection_name)
    col.load()
    return col


def search_articles(query: str, top_k: int = 5) -> list[dict]:
    """
    Returns up to `top_k` article chunks relevant to a medical question,
    e.g.:

    [{"title": "...", "text": "<matching chunk>", "author": "...",
      "category": "...", "url": "...", "score": 0.81}]

    Unlike search_doctors, we don't deduplicate/aggregate by article here —
    each chunk is returned as-is, since a single answer may draw on
    multiple chunks (possibly from different articles).
    """
    col = _get_articles_collection()
    query_vec = embed_query(query)

    results = col.search(
        data=[query_vec],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {}},
        limit=top_k,
        output_fields=["title", "text", "author", "category", "url"],
    )

    return [
        {
            "title": hit.entity.get("title"),
            "text": hit.entity.get("text"),
            "author": hit.entity.get("author"),
            "category": hit.entity.get("category"),
            "url": hit.entity.get("url"),
            "score": hit.distance,
        }
        for hit in results[0]
    ]