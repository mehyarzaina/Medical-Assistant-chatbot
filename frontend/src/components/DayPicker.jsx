import { useId } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { addDaysISO, todayISO, weekdayOfISO } from '../utils/date';
import './Booking.css';

const DAYS_SHOWN = 14;

// Two weeks of day buttons, plus a date field for anything further out.
// Days the doctor doesn't work are shown but disabled, when the schedule is known.
function DayPicker({ value, onChange, workingDays }) {
  const { t, lang } = useLanguage();
  const labelId = useId();
  const otherId = useId();
  const locale = lang === 'ar' ? 'ar-JO-u-nu-latn' : 'en-GB';
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const dayNum = new Intl.DateTimeFormat(locale, { day: 'numeric' });
  const month = new Intl.DateTimeFormat(locale, { month: 'short' });
  const full = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  const today = todayISO();
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDaysISO(today, i));
  const hasSchedule = workingDays && workingDays.size > 0;

  return (
    <div className="day-picker">
      <p className="field-label" id={labelId}>{t('booking.chooseDay')}</p>
      <div className="day-strip" role="group" aria-labelledby={labelId}>
        {days.map((iso) => {
          const date = new Date(`${iso}T12:00:00`);
          const closed = hasSchedule && !workingDays.has(weekdayOfISO(iso));
          const selected = iso === value;
          return (
            <button
              type="button"
              key={iso}
              className={`day-chip ${selected ? 'is-selected' : ''}`}
              aria-pressed={selected}
              disabled={closed}
              aria-label={`${full.format(date)}${closed ? ` · ${t('booking.closed')}` : ''}`}
              onClick={() => onChange(iso)}
            >
              <span className="day-chip-weekday">{iso === today ? t('booking.today') : weekday.format(date)}</span>
              <span className="day-chip-num">{dayNum.format(date)}</span>
              <span className="day-chip-month">{month.format(date)}</span>
            </button>
          );
        })}
      </div>
      <div className="day-other">
        <label htmlFor={otherId} className="field-hint">{t('booking.otherDate')}</label>
        <input
          id={otherId}
          type="date"
          className="input day-other-input"
          min={today}
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export default DayPicker;
