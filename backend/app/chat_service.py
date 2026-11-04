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
import re

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
(Arabic or English). Always reply in the language of the patient's most
recent message, even if the retrieved articles or doctor data are in a
different language — translate what you use.

Your job:
- If the patient describes possible emergency signs (chest pain, trouble
  breathing, signs of stroke, severe bleeding, loss of consciousness,
  thoughts of self-harm), first tell them to call 911 or go to the
  nearest emergency department now, before anything else. Jordan's
  emergency number is 911 in every language; write it as "911" and never
  give any other number.
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


LANGUAGE_NAMES = {"ar": "Arabic", "en": "English"}

ERROR_REPLIES = {
    "ar": "عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى.",
    "en": "Sorry, something went wrong while handling your request. Please try again.",
}


def detect_language(text: str, fallback: str = "en") -> str:
    """Pick 'ar' or 'en' from the script the message is written in.

    Messages with no letters at all (a number, an emoji) fall back to the
    site's UI language, so the reply still matches what the patient sees.
    """
    arabic = sum(1 for ch in text if "؀" <= ch <= "ۿ")
    latin = sum(1 for ch in text if ch.isascii() and ch.isalpha())
    if arabic == 0 and latin == 0:
        return fallback if fallback in LANGUAGE_NAMES else "en"
    return "ar" if arabic >= latin else "en"


# The model invents Jordan's emergency number (100, 115, 997, 999...), even
# when told it is 911. In replies about an emergency, a 2-4 digit number that
# follows "call"/"number" in the same sentence is rewritten to 911. Other
# numbers (doses, "for 14 days") don't follow those words and are left alone.
_EMERGENCY_WORD = re.compile(r"emergency|ambulance|طوارئ|إسعاف|اسعاف", re.IGNORECASE)
_CALLED_NUMBER = re.compile(
    r"(?P<before>(?:\bcall\b|\bdial\b|number|رقم|اتصل|الاتصال)[^\d٠-٩.!?؟\n]{0,40}?)"
    r"(?P<number>(?<![\d٠-٩])[\d٠-٩]{2,4}(?![\d٠-٩]))"
    # ...unless it's a quantity: "call your doctor in 24 hours", "خلال 48 ساعة"
    r"(?!\s*(?:hours?|hrs?|days?|minutes?|mins?|weeks?|mg|ml|ساع|يوم|أيام|ايام|دقيق|دقائق|أسبوع|اسبوع|ملغ|مل\b))",
    re.IGNORECASE,
)


def enforce_emergency_number(reply: str) -> str:
    if not _EMERGENCY_WORD.search(reply):
        return reply
    return _CALLED_NUMBER.sub(lambda m: m.group("before") + "911", reply)


MAX_RESTORED_TURNS = 20  # messages restored from the browser when Redis has expired


async def handle_chat_message(
    session_id: str,
    message: str,
    ui_language: str = "en",
    saved_history: list[dict] | None = None,
) -> tuple[str, list]:
    history = await _get_history(session_id)
    if not history and saved_history:
        # Redis forgot this conversation (30 min TTL); fall back to the copy
        # the browser kept. Plain user/assistant text only — no tool messages.
        history = [
            {"role": m["role"], "content": m["content"]}
            for m in saved_history[-MAX_RESTORED_TURNS:]
            if m.get("role") in ("user", "assistant") and m.get("content")
        ]
    reply_language = detect_language(message, fallback=ui_language)

    # The model drifts toward the language of the history or the retrieved
    # Arabic articles, so pin the reply language for this turn explicitly.
    language_rule = {
        "role": "system",
        "content": (
            f"Reply to this message in {LANGUAGE_NAMES[reply_language]} only. "
            "If you mention an emergency number, it is 911 (written as the digits 911)."
        ),
    }
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history
    messages.append({"role": "user", "content": message})
    messages.append(language_rule)

    doctors_out: list = []
    reply_text = ""

    for _ in range(MAX_TOOL_ROUNDS):
        completion = await client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            # Caps token spend. The model reasons before answering and that
            # counts toward the cap, so 400 sometimes left nothing for the reply.
            max_tokens=1024,
        )
        msg = completion.choices[0].message

        if not msg.tool_calls:
            if not (msg.content or "").strip():
                continue  # empty answer: ask again (counts toward MAX_TOOL_ROUNDS)
            reply_text = msg.content
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
        reply_text = ERROR_REPLIES[reply_language]

    reply_text = enforce_emergency_number(reply_text)

    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply_text})
    await _save_history(session_id, history)

    return reply_text, doctors_out