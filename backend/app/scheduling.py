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