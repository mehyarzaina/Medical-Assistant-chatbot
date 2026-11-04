# scheduling.py
from app.config import get_settings

settings = get_settings()


_WEEKDAY_AR = {
    0: "الاثنين",
    1: "الثلاثاء",
    2: "الأربعاء",
    3: "الخميس",
    4: "الجمعة",
    5: "السبت",
    6: "الأحد",
}


def day_name_query(weekday: int) -> dict:
    """Mongo filter matching a weekday's stored name in either spelling.
    The availability data writes some days without the hamza ("الاربعاء",
    "الاحد"), so an exact match on _WEEKDAY_AR silently misses them."""
    name = _WEEKDAY_AR[weekday]
    plain = name.replace("أ", "ا").replace("إ", "ا")
    return {"$in": sorted({name, plain})}


def normalize_day_name(name: str) -> str:
    return name.strip().replace("أ", "ا").replace("إ", "ا")


def open_slots(from_time: str, to_time: str, taken: set[str], day, now=None) -> list[str]:
    """Bookable start times on `day`: the template's slots minus booked ones,
    and, for today, minus times that have already passed."""
    import datetime as dt

    slots = [t for t in _generate_slots(from_time, to_time) if t not in taken]
    now = now or dt.datetime.now()
    if day == now.date():
        slots = [
            t for t in slots
            if dt.datetime.combine(day, dt.datetime.strptime(t, "%I:%M %p").time()) > now
        ]
    return slots


def _generate_slots(from_time: str, to_time: str) -> list[str]:
    """Expands a doctor's from/to availability window into bookable slot
    start-times, spaced by `settings.appointment_duration_minutes` (30 by
    default — change APPOINTMENT_DURATION_MINUTES in .env to adjust).

    Example: from_time='08:00 AM', to_time='05:00 PM', 30-min slots ->
    ['8:00 AM', '8:30 AM', '9:00 AM', ..., '4:30 PM']
    (4:30 PM is the last slot because 4:30 + 30min = 5:00 PM, exactly at
    the boundary; a slot starting at 5:00 PM itself is excluded since it
    would run past closing time.)
    """
    import datetime as dt

    start = dt.datetime.strptime(from_time.strip(), "%I:%M %p")
    end = dt.datetime.strptime(to_time.strip(), "%I:%M %p")
    step = dt.timedelta(minutes=settings.appointment_duration_minutes)
    slots = []
    cur = start
    while cur + step <= end:
        slots.append(cur.strftime("%I:%M %p").lstrip("0"))
        cur += step
    return slots