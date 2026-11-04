import { useLanguage } from '../i18n/useLanguage';
import './AvailabilitySchedule.css';

function AvailabilitySchedule({ schedule, loading }) {
  const { t } = useLanguage();
  // Day names are stored in Arabic; the English dictionary maps them, the Arabic one is empty.
  const dayNames = t('days');

  if (loading) return <p className="availability-status">{t('doctor.loadingAvailability')}</p>;
  if (!schedule || schedule.length === 0) {
    return <p className="availability-status">{t('doctor.noAvailability')}</p>;
  }
  return (
    <ul className="availability-list">
      {schedule.map((day) => (
        <li key={day.day_name} className="availability-row">
          <span className="availability-day">{dayNames[day.day_name] ?? day.day_name}</span>
          <span className="availability-time" dir="ltr">{day.from_time} – {day.to_time}</span>
        </li>
      ))}
    </ul>
  );
}

export default AvailabilitySchedule;
