// Local date as YYYY-MM-DD. toISOString() alone is UTC, which shows
// "yesterday" between midnight and 3 a.m. in Jordan.
export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}
