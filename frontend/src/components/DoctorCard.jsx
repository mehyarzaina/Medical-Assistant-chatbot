import { useState } from 'react';
import { getDoctorAvailability } from '../api';
import AvailabilitySchedule from './AvailabilitySchedule';
import './DoctorCard.css';

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
}

function DoctorCard({ doctor, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  function toggleExpanded(e) {
    e.stopPropagation();
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
    <div className="doctor-row">
      <button type="button" className="doctor-row-view-btn" onClick={() => onSelect(doctor.doctor_id)}>
        View profile
      </button>

      <div className="doctor-row-content">
        <div className="doctor-row-header">
          <div className="doctor-row-name-block">
            <h3 className="doctor-row-name">{doctor.name}</h3>
            {doctor.specialty && <span className="doctor-row-specialty">{doctor.specialty}</span>}
          </div>
          <div className="doctor-avatar">{getInitials(doctor.name)}</div>
        </div>

        {doctor.location && (
          <p className="doctor-row-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {doctor.location}
          </p>
        )}

        {doctor.about && (
          <p className="doctor-row-about">
            {expanded ? doctor.about : (doctor.about.length > 140 ? `${doctor.about.slice(0, 140)}…` : doctor.about)}{' '}
            <span className="doctor-row-more" onClick={toggleExpanded}>
              {expanded ? 'See less' : 'See more'}
            </span>
          </p>
        )}

        {expanded && (
          <div className="doctor-row-availability">
            <h4>Availability</h4>
            <AvailabilitySchedule schedule={schedule} loading={loadingSchedule} />
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorCard;