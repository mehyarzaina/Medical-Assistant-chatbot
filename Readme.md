# Technical Documentation

A bilingual (Arabic/English) medical assistant and doctor-booking platform.
Patients can ask grounded health questions, get matched to real doctors, book
appointments, and manage those bookings — all without a full user-account
system.

> **Note on scope:** this document describes the FastAPI + React + MongoDB
> rebuild (local folders `Medical_chatbot/` and `medical-chatbot-frontend/`),
> which is the active codebase this documentation was built from. A few files
> referenced below (`config.py`, `insurance.py`, `google_calendar.py`,
> `Chat.jsx`, `BookingModal.jsx`) were not pasted directly in the conversation
> this doc was generated from — they're described based on how other files
> import and call them. Double-check exact field/function names against your
> actual files where marked **(inferred)**.

---

## 1. Tech stack at a glance

| Layer | Technology | Role |
|---|---|---|
| Backend framework | **FastAPI** (Python), Uvicorn | REST API, async request handling |
| Primary database | **MongoDB Atlas** (Motor async driver) | Source of truth: doctors, availability, appointments, patients, insurance |
| Vector database | **Zilliz Cloud (Milvus)** | Semantic search over doctor bios and medical articles |
| Embeddings | Custom embedding endpoint (`EMBEDDING_URL`/`EMBEDDING_API_KEY`) — **(inferred: Qwen embeddings, 768-dim)** | Turns text into vectors for Zilliz search |
| Conversational LLM | **Groq** (`openai/gpt-oss-20b`, OpenAI-compatible tool-calling) | Chat replies, symptom intake, tool orchestration |
| Cache / session store | **Redis** (`redis.asyncio`) | Chat history, OTP codes, OTP sessions |
| Calendar | **Google Calendar API (personal Gmail)** | Display-only log of confirmed bookings |
| Email | **Gmail SMTP** (`smtplib`) | Booking/cancel/reschedule confirmations, OTP codes |
| Frontend framework | **React** + Vite | UI, client-side routing |
| Routing | **React Router** (`BrowserRouter`, `useParams`, `useSearchParams`) | Page navigation, query-string tokens |
| Security | Python `secrets` module | Access tokens, OTP codes, session tokens (all timing-safe compared) |

---

## 2. High-level architecture

```
┌─────────────────┐        ┌──────────────────────┐
│  React Frontend │  HTTP  │   FastAPI Backend     │
│  (Vite, :5173)  │◄──────►│   (Uvicorn, :8000)    │
└─────────────────┘        └──────────┬───────────┘
                                       │
        ┌──────────────┬──────────────┼───────────────┬───────────────┐
        ▼              ▼              ▼               ▼               ▼
   MongoDB Atlas    Redis         Zilliz Cloud       Groq API     Gmail SMTP /
  (source of truth) (cache/OTP/  (RAG vector search) (chat LLM)   Google Calendar
                     chat memory)                                 (side effects)
```

**Key principle carried through the whole app:** MongoDB is always the
source of truth for availability and appointments. Google Calendar is a
**display log only** — never read back for scheduling truth. This avoids
the two systems ever disagreeing about what's actually booked.

---

## 3. Databases in detail

### 3.1 MongoDB Atlas — database `altibbi_dr`

| Collection | Purpose | Key fields |
|---|---|---|
| `doctors` | Doctor profiles | `doctor_id`, `name`, `specialty`, `location` (format: `"City, Country"`), `phone`, `about`, `profile_url` |
| `doctor_availability` | Recurring **weekly** schedule template (not live slots) | `doctor_id`, `day_name` (Arabic weekday), `day_order`, `from_time`, `to_time` |
| `appointments` | Actual bookings — source of truth | `appointment_id` (UUID), `access_token` (secret, added post-security-fix), `doctor_id`, `patient_email`, `patient_name`, `patient_phone`, `date`, `time`, `google_event_id`, `status` (`confirmed`/`cancelled`), `cancel_reason` |
| `patients` | Upserted on every booking, keyed by email | `email`, `name`, `phone`, `notes` |
| `insurance_companies` | Master list of insurers | `id`, `name` |
| `doctor_insurance` | Junction table | `doctor_id`, `insurance_id` |

**Indexes** (created once at startup via `ensure_indexes()` in `database.py`):
- `doctor_availability`: compound `(doctor_id, day_name)`
- `appointments`: unique sparse on `google_event_id`; compound `(doctor_id, date, time)` for fast double-booking checks
- `doctors`: unique on `doctor_id`
- `patients`: on `email` and `phone`
- `doctor_insurance`: on `doctor_id` and `insurance_id`
- `insurance_companies`: unique on `id`

**Important caveat:** appointments booked before the access-token security
fix have **no `access_token` field**. Every place that reads this field uses
`.get("access_token", "")` rather than `["access_token"]` so old records
degrade gracefully (their cancel/reschedule links just correctly fail
validation) instead of crashing the whole request.

### 3.2 Redis

Originally used only for caching AI-generated specialty matches (Gemini
era). Since the Groq switch, its job expanded to three unrelated uses, all
keyed by prefix:

| Key pattern | Purpose | TTL |
|---|---|---|
| `chat_history:{session_id}` | Rolling conversation memory for the Chat page | 30 min |
| `otp:{email}` | One-time verification code, pending entry | 10 min |
| `otp_session:{session_token}` | Verified session → maps token to the email it belongs to | 1 hour |

All access goes through `app/redis_client.py`'s `cache_get`/`cache_set`
helpers, which JSON-encode values and centralize the connection (`redis.asyncio`,
`redis.from_url(settings.redis_url)`), so nothing else in the codebase opens
its own Redis connection.

### 3.3 Zilliz Cloud (Milvus) — cluster `Free-01`

Two **separate** collections, distinct from the Mongo `altibbi_dr` database
entirely:

| Collection | Purpose | Schema (articles) |
|---|---|---|
| `altibbi_doctors` | Doctor bio/profile embeddings for semantic doctor matching | doctor_id + metadata |
| `altibbi_articles` | ~197K Altibbi medical article embeddings for grounded Q&A | `article_id`, `chunk_index`, `text`, `title`, `author`, `category`, `pub_date`, `url` |

Both are queried through `app/rag_search.py`:
- `search_doctors()` → powers `/doctors/recommend` and the chat's `find_doctors` tool
- `search_articles()` → powers the chat's `search_medical_info` tool

---

## 4. AI / RAG layer

### 4.1 Embeddings
A separate embedding service (env vars `EMBEDDING_URL` / `EMBEDDING_API_KEY`)
converts text to vectors before anything hits Zilliz. This is **independent**
of the conversational LLM — it was never Gemini and wasn't touched by the
Groq migration.

### 4.2 Conversational LLM — Groq
- Model: `openai/gpt-oss-20b` (free tier, no card required)
- Client: `AsyncGroq`, OpenAI-compatible tool-calling format
- `max_tokens=400` to keep replies short and control spend
- Switched from Gemini after Gemini's prepaid credits were exhausted
  (`RESOURCE_EXHAUSTED`)
- If Groq deprecates a model again, check what's live on your key:
  ```
  curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
  ```

### 4.3 Chat orchestration — `app/chat_service.py`
- System prompt instructs the model to:
  - Answer general medical questions **only** from `search_medical_info` results (never its own general knowledge)
  - Ask brief intake follow-up questions before recommending a doctor
  - Never diagnose
- Two tools exposed to the model: `find_doctors`, `search_medical_info`
- Tool-call loop caps at `MAX_TOOL_ROUNDS = 4` so the model can chain calls (e.g. search articles, then find a doctor) without looping forever
- Conversation history persisted in Redis (`chat_history:{session_id}`) so follow-up references ("find me a doctor for **that**") resolve correctly within a session

---

## 5. Security design

### 5.1 Appointment access tokens
**Problem solved:** originally, cancel/reschedule email links carried only
a bare `appointment_id` — anyone who obtained that ID (forwarded email,
guess) could act on someone else's appointment.

**Fix:** a random `access_token = secrets.token_urlsafe(32)` is generated at
booking time, stored on the appointment document, and required — as a query
param or request body field — on every cancel/reschedule/get-appointment
call. Comparison uses `secrets.compare_digest()` (timing-safe, avoids
timing-attack leakage of the correct token).

### 5.2 OTP authentication for "My Appointments"
Since there's no full account system, viewing "all my appointments by
email" needed its own lightweight guard:

1. `POST /auth/request-code {email}` → generates a 6-digit code
   (`secrets.randbelow(1_000_000)`), stores it in Redis for 10 minutes,
   emails it via Gmail SMTP
2. `POST /auth/verify-code {email, code}` → checks the code with
   `secrets.compare_digest`, and on success issues a `session_token`
   (another `secrets.token_urlsafe(32)`), stored in Redis mapped to that
   email for 1 hour; the used code is deleted (one-time use)
3. `GET /appointments?patient_email=...&session_token=...` → resolves the
   session token back to an email via `get_email_from_session()`, then
   confirms it matches the requested `patient_email` before returning
   anything — a valid session for one email can't be used to query another

This reuses the exact same `secrets`/Redis/email patterns as the
appointment-token system, rather than introducing a separate auth
mechanism.

---

## 6. Backend file guide (`Medical_chatbot/app/`)

| File | What it does |
|---|---|
| `main.py` | FastAPI app instance, CORS setup (open to `localhost:5173` in dev), registers all routers, runs `ensure_indexes()` on startup, `/health` endpoint |
| `config.py` **(inferred)** | Centralized settings via env vars — Mongo URI/DB name, Groq key/model, Gmail credentials, Redis URL, frontend base URL, embedding service credentials |
| `database.py` | Motor async Mongo client (singleton), one accessor function per collection, `ensure_indexes()` |
| `redis_client.py` | Redis client singleton + generic `cache_get`/`cache_set` JSON helpers used everywhere Redis is touched |
| `models.py` | Every Pydantic request/response schema: doctors, appointments, chat, auth/OTP, availability |
| `rag_search.py` | `search_doctors()` / `search_articles()` — the only code that talks to Zilliz directly |
| `chat_service.py` | Conversational core: system prompt, tool definitions, tool-call loop, Redis-backed history |
| `gemini_service.py` | **Legacy name, misleading** — no longer touches Gemini at all; now just a thin wrapper around `search_doctors()`. Candidate rename: `doctor_matching_service.py` (2 import sites to update: `routers/doctors.py`, `chat_service.py`) |
| `email_service.py` | All outbound email HTML templates + senders: booking confirmation, cancellation, reschedule, OTP code. All calls are blocking (`smtplib`), so always invoked via `BackgroundTasks`, never awaited directly in a request path |
| `google_calendar.py` **(inferred)** | Creates/deletes/updates calendar events; stores `doctor_id` in `extendedProperties` so multiple doctors can share one personal calendar |
| `scheduling.py` | `_generate_slots()` (turns a from/to time window into 30-min slots) and `_WEEKDAY_AR` (weekday-index → Arabic day-name mapping used to match `doctor_availability` documents) |
| `routers/doctors.py` | Doctor directory (`GET /doctors` with specialty/location/insurance filters), `/doctors/recommend` (semantic match via Zilliz), `/doctors/{id}/insurance`, `/doctors/{id}/availability` (weekly schedule), shared `enrich_doctor_matches()` helper used by both the recommend endpoint and the chat's `find_doctors` tool |
| `routers/appointments.py` | Book, cancel, reschedule, get-one, and list-by-email endpoints; the shared `_get_appointment_with_valid_token()` guard |
| `routers/chat.py` | `POST /chat` — thin wrapper around `chat_service.py` |
| `routers/auth.py` | OTP `request-code` / `verify-code`, plus the shared `get_email_from_session()` guard imported by `appointments.py`'s list endpoint |
| `routers/insurance.py` **(inferred)** | Insurance company listing endpoint used by the Doctors page filter |

### Most important files if you're getting oriented
1. **`routers/appointments.py`** — the most security-sensitive file; almost every booking-flow bug so far has lived here
2. **`chat_service.py`** — where the RAG grounding and doctor-recommendation behavior is actually defined (the system prompt is the real "product spec" for the assistant's behavior)
3. **`models.py`** — read this first when adding any new endpoint; it's the contract every router relies on
4. **`database.py` + `redis_client.py`** — the only two places that should ever open a database/cache connection; everything else imports from here

---

## 7. Frontend file guide (`medical-chatbot-frontend/src/`)

| File | What it does |
|---|---|
| `App.jsx` | All route definitions (`react-router-dom`) |
| `api.js` | Every backend call, wrapped in a single `apiFetch()` helper that handles the base URL and error parsing |
| `pages/Welcome.jsx` **(inferred)** | Landing page |
| `pages/Chat.jsx` + `.css` **(inferred)** | Conversational assistant UI — message list, input bar, inline `DoctorCard`s for doctor recommendations |
| `pages/Doctors.jsx` + `.css` | Doctor directory: loads all doctors + insurance list once, re-queries the backend when specialty/location/insurance filters change, applies an additional **client-side** name search on top of whatever the backend already returned |
| `pages/MyAppointments.jsx` + `.css` | Three-step flow: email entry → OTP code entry → appointment list, with Cancel/Reschedule links built from each appointment's `access_token` |
| `pages/Cancel.jsx` + `.css` | Reads `appointmentId` (route param) + `token` (query string), shows booking details, confirms cancellation |
| `pages/Reschedule.jsx` + `.css` **(inferred)** | Same token pattern as Cancel, plus a date/slot picker mirroring `BookingModal.jsx` |
| `pages/About.jsx` + `.css` | Static platform-mission page with a medical disclaimer |
| `components/FilterBar.jsx` + `.css` | Renders one `MultiSelectDropdown` per filter category (specialty/location/insurance) |
| `components/MultiSelectDropdown.jsx` + `.css` | Generic reusable checkbox dropdown — closes on outside click, OR-combines selections within its own category |
| `components/DoctorCard.jsx` + `.css` | Full-width stacked doctor row; expandable bio with lazy-loaded weekly availability on "See more" |
| `components/DoctorDetail.jsx` + `.css` | Modal/panel opened via "View profile" — doctor details, insurance tags, availability schedule, and the entry point to `BookingModal` |
| `components/AvailabilitySchedule.jsx` + `.css` | Shared component rendering a weekly schedule list — used identically by both `DoctorCard` and `DoctorDetail` so the two never drift out of sync |
| `components/BookingModal.jsx` + `.css` **(inferred)** | Date/slot picker + patient info form that actually calls `bookAppointment()` |
| `components/Sidebar.jsx` **(inferred)** | Main navigation |
| `components/BackButton.jsx` **(inferred)** | Shared back-navigation control used across pages |

---

## 8. Design system

The frontend uses CSS custom properties rather than hardcoded colors —
always use these instead of hex values when styling anything new:

| Variable | Used for |
|---|---|
| `--ink` | Primary text color |
| `--ink-soft` | Secondary/muted text |
| `--card` | Card/panel background |
| `--paper` | Page background |
| `--border` | Border color |
| `--radius-md` / `--radius-lg` | Border radius scale |
| `--font-display` | Heading font |
| `--error` | Error-state color |

---

## 9. Environment variables

Collected from everything referenced across the backend **(some inferred
from usage, not seen directly — verify against your real `.env`)**:

```
MONGO_URI=...
MONGO_DB_NAME=altibbi_dr

REDIS_URL=...

GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-20b
ARTICLES_COLLECTION_NAME=altibbi_articles

EMBEDDING_URL=...
EMBEDDING_API_KEY=...

GMAIL_ADDRESS=...
GMAIL_APP_PASSWORD=...
FRONTEND_BASE_URL=http://localhost:5173

# Google Calendar — likely a service account or OAuth credentials file (inferred)
```

Old `GEMINI_API_KEY` / `GEMINI_MODEL` settings are dead and safe to remove —
nothing references them post-migration.

---

## 10. Running it locally

**Backend:**
```bash
cd Medical_chatbot
# .venv already set up per project notes
uvicorn app.main:app --reload
# → http://localhost:8000, docs at http://localhost:8000/docs
```

**Frontend:**
```bash
cd medical-chatbot-frontend
npm run dev
# → http://localhost:5173
```

**Prerequisites to have running/configured before either will fully work:**
- MongoDB Atlas cluster reachable, with the six collections above populated
- Redis instance reachable (local `redis-server` or a cloud instance) — if Redis is down, `/auth/request-code`, `/appointments` (list), and the Chat page will all fail
- Zilliz Cloud collections (`altibbi_doctors`, `altibbi_articles`) populated with embeddings
- A valid `GROQ_API_KEY`
- Gmail app password configured for the sending address (not the regular account password)
- Google Calendar credentials for the personal calendar used as the display log

**A note on hot-reload during development:** `uvicorn --reload` can serve
one request against the *old* code while it's mid-restart after a file
save, producing a confusing transient 404/stale-behavior. If something
that was just fixed still seems broken, fully stop the server (Ctrl+C,
wait for "Application shutdown complete") and start it fresh rather than
trusting the auto-reload for anything security- or logic-critical you're
actively testing.

---

## 11. Known limitations / open items

- **No real authentication system** — OTP-gated email lookup is a
  lightweight compromise, not full accounts. Fine for testing; would need
  hardening (rate-limiting code requests, shorter TTLs, maybe IP throttling)
  before wider use.
- **No slot-locking** — booking assumes one user at a time. A short-TTL
  Redis lock on `(doctor_id, date, time)` around book/reschedule would be
  needed before multi-user use, to close the race between the availability
  check and the insert.
- **Legacy appointments lack `access_token`** — by design, their old
  cancel/reschedule links (and My Appointments actions) will correctly
  403. Can be backfilled manually in Mongo if needed for testing.
- **`gemini_service.py` filename is misleading** — cosmetic rename to
  `doctor_matching_service.py` still pending (2 import sites).
- **Mobile responsiveness** — only lightly considered so far across pages.
- **Loading/empty/error state coverage** — solid on Doctors/Booking; worth
  a pass on Chat/Cancel/Reschedule/My Appointments.
- **Arabic day names in English UI** — `AvailabilitySchedule` currently
  renders `day_name` exactly as stored (Arabic), even on English-language
  pages. Not yet translated for display.
