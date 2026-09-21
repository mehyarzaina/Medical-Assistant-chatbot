# app/gemini_service.py
"""
Doctor recommendation via Zilliz RAG search (app/rag_search.py).
No Gemini dependency here — the actual conversational model lives in
chat_service.py (Groq).
"""

from app.rag_search import search_doctors


async def recommend_doctors(query: str, top_k: int = 3) -> list[dict]:
    """
    Semantic doctor recommendation: matches doctors by what's actually
    written in their bio/profile text via Zilliz vector search.
    """
    return search_doctors(query, top_k_doctors=top_k)