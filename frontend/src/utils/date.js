// Local date as YYYY-MM-DD. toISOString() alone is UTC, which shows
// "yesterday" between midnight and 3 a.m. in Jordan.
export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

// ISO date `days` after `iso`, computed at local noon so DST shifts can't skip a day.
export function addDaysISO(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
}

// "Mon, 14 Sep 2026" / "الاثنين، 14 أيلول 2026" for a YYYY-MM-DD string.
export function formatDateISO(iso, lang, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-JO-u-nu-latn' : 'en-GB', options).format(new Date(`${iso}T12:00:00`));
}

// Weekly hours are stored with Arabic day names, spelled with and without
// hamza; normalise so "الأربعاء" and "الاربعاء" match.
const WEEKDAYS_AR = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة', 'السبت'];

function normalizeDayName(name = '') {
  return name.trim().replace(/[أإآ]/g, 'ا');
}

// Set of weekday numbers (0 = Sunday) a doctor works, from their weekly schedule.
export function workingWeekdays(schedule = []) {
  const names = new Set(schedule.map((d) => normalizeDayName(d.day_name)));
  return new Set(WEEKDAYS_AR.map((name, i) => (names.has(name) ? i : -1)).filter((i) => i >= 0));
}

export function weekdayOfISO(iso) {
  return new Date(`${iso}T12:00:00`).getDay();
}
