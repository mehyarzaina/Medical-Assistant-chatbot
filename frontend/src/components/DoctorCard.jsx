import { useId, useState } from 'react';
import { getDoctorAvailability } from '../api';
import { useLanguage } from '../i18n/useLanguage';
import AvailabilitySchedule from './AvailabilitySchedule';
import { getInitials } from '../utils/doctor';
import './DoctorCard.css';

const ABOUT_PREVIEW_LENGTH = 140;

function DoctorCard({ doctor, onSelect }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const detailsId = useId();

  const aboutIsLong = doctor.about && doctor.about.length > ABOUT_PREVIEW_LENGTH;

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    if (next && schedule === null) {
      setLoadingSchedule(true);
      getDoctorAvailability(doctor.doctor_id)
        .then((data) => setSchedule(data.schedule))
        .catch(() => setSchedule([]))
        .finally(() => setLoadingSchedule(false));
    }
  }

  return (
    <article className="doctor-row">
      <div className="doctor-avatar" aria-hidden="true" dir="auto">{getInitials(doctor.name)}</div>

      <div className="doctor-row-content">
        <h3 className="doctor-row-name" dir="auto">{doctor.name}</h3>
        {doctor.specialty && <p className="doctor-row-specialty" dir="auto">{doctor.specialty}</p>}

        {doctor.location && (
          <p className="doctor-row-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <span className="visually-hidden">{t('doctor.location')}: </span>
            <span dir="auto">{doctor.location}</span>
          </p>
        )}

        {doctor.about && (
          <p className="doctor-row-about" dir="auto" id={detailsId}>
            {expanded || !aboutIsLong ? doctor.about : `${doctor.about.slice(0, ABOUT_PREVIEW_LENGTH)}…`}
          </p>
        )}

        {expanded && (
          <div className="doctor-row-availability">
            <h4>{t('doctor.availability')}</h4>
            <AvailabilitySchedule schedule={schedule} loading={loadingSchedule} />
          </div>
        )}

        <div className="doctor-row-actions">
          <button
            type="button"
            className="doctor-row-view-btn"
            onClick={() => onSelect(doctor.doctor_id)}
            aria-label={t('doctor.profileOf', { name: doctor.name })}
          >
            {t('doctor.viewProfile')}
          </button>
          <button
            type="button"
            className="doctor-row-more"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-controls={detailsId}
          >
            {expanded ? t('doctor.seeLess') : t('doctor.seeMore')}
          </button>
        </div>
      </div>
    </article>
  );
}

export default DoctorCard;
