# app/chat_service.py
"""
Conversational intake layer, now on Groq instead of Gemini.

Two tools available to the model:
  - search_medical_info: looks up general health questions in the
    altibbi_articles Zilliz collection.
  - find_doctors: looks up matching doctors in the altibbi_doctors
    Zilliz collection, same search used by /doctors/recommend.

Flow is the same as before — history in Redis, tool-call loop — just
using Groq's OpenAI-compatible chat completions API instead of Gemini's
SDK. Messages/tool-calls follow the OpenAI message format.
"""

import json

from groq import AsyncGroq

from app.config import get_settings
from app.gemini_service import recommend_doctors
from app.rag_search import search_articles
from app.redis_client import cache_get, cache_set
from app.routers.doctors import enrich_doctor_matches

settings = get_settings()
client = AsyncGroq(api_key=settings.groq_api_key)

HISTORY_TTL_SECONDS = 1800  # 30 min of inactivity and the session resets
MAX_TOOL_ROUNDS = 4  # safety cap so a confused model can't loop forever

SYSTEM_PROMPT = """You are a friendly medical intake assistant for a doctor
booking website. You talk to patients in whatever language they write in
(Arabic or English).

Your job:
- If the patient asks a general medical/health question (symptoms, what a
  condition is, general care info), call search_medical_info to look it up
  in the Altibbi article database, then answer USING ONLY that retrieved
  content — do not add facts from your own general knowledge. Mention
  briefly that this isn't a substitute for seeing a doctor when relevant.
- If search_medical_info returns nothing relevant, say you couldn't find
  reliable info on that and suggest they see a doctor.
- If the patient describes symptoms and seems to want to book or be
  matched with a doctor (not just learn about a condition), ask short
  follow-up questions about symptoms/duration/severity like a receptionist
  doing intake, then call find_doctors once you have a clear enough
  picture.
- Don't call find_doctors on the very first message unless the patient
  already stated a clear specialty need (e.g. "I need a dentist").
- You are not a doctor. Never diagnose or prescribe treatment.
- After find_doctors returns results, tell the patient in 1-2 sentences
  that you found some options — the doctor cards are shown separately by
  the app, so don't list doctor details yourself in the reply text.
- Keep replies short and to the point.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "find_doctors",
            "description": (
                "Search for doctors matching the patient's described "
                "symptoms or specialty need. Call only once you understand "
                "what kind of doctor the patient needs."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Short description of the medical need/symptoms/specialty.",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_medical_info",
            "description": (
                "Look up general medical/health information (symptoms, "
                "conditions, general care) in the Altibbi article database. "
                "Call this for informational questions, not when the "
                "patient wants a doctor recommendation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The patient's health question, in their own words.",
                    }
                },
                "required": ["query"],
            },
        },
    },
]


async def _get_history(session_id: str) -> list[dict]:
    return await cache_get(f"chat_history:{session_id}") or []


async def _save_history(session_id: str, history: list[dict]) -> None:
    await cache_set(f"chat_history:{session_id}", history, ttl_seconds=HISTORY_TTL_SECONDS)


async def handle_chat_message(session_id: str, message: str) -> tuple[str, list]:
    history = await _get_history(session_id)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history
    messages.append({"role": "user", "content": message})

    doctors_out: list = []
    reply_text = ""

    for _ in range(MAX_TOOL_ROUNDS):
        completion = await client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=400,  # keeps replies short and caps token spend
        )
        msg = completion.choices[0].message

        if not msg.tool_calls:
            reply_text = msg.content or ""
            break

        # Record the assistant's tool-call turn before appending results.
        messages.append(
            {
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in msg.tool_calls
                ],
            }
        )

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)

            if tc.function.name == "find_doctors":
                query = args["query"]
                matches = await recommend_doctors(query, top_k=3)
                doctors_out = (
                    await enrich_doctor_matches(matches, days_ahead=5) if matches else []
                )
                result = {
                    "found": len(doctors_out),
                    "doctors": [
                        {"name": d.name, "specialty": d.specialty, "location": d.location}
                        for d in doctors_out
                    ],
                }

            elif tc.function.name == "search_medical_info":
                query = args["query"]
                articles = search_articles(query, top_k=5)
                result = {
                    "found": len(articles),
                    "chunks": [
                        {"title": a["title"], "text": a["text"], "category": a["category"]}
                        for a in articles
                    ],
                }

            else:
                result = {"error": "unknown tool"}

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result, ensure_ascii=False),
                }
            )
    else:
        # Hit MAX_TOOL_ROUNDS without a final answer — bail gracefully.
        reply_text = "عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى."

    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply_text})
    await _save_history(session_id, history)

    return reply_text, doctors_out