import { useState } from 'react';
import BookingModal from './BookingModal';
import './RecommendedDoctorCard.css';

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
}

function RecommendedDoctorCard({ doctor }) {
  const [showBooking, setShowBooking] = useState(false);
  const firstDay = doctor.upcoming_availability?.[0];

  return (
    <div className="rec-doctor-card">
      <div className="rec-doctor-top">
        <div className="doctor-avatar">{getInitials(doctor.name)}</div>
        <div>
          <h3>{doctor.name}</h3>
          {doctor.specialty && <span className="doctor-specialty-tag">{doctor.specialty}</span>}
        </div>
      </div>

      {doctor.location && <p className="rec-doctor-location">📍 {doctor.location}</p>}
      {doctor.matched_text && <p className="rec-doctor-match">{doctor.matched_text}</p>}

      {firstDay && firstDay.times.length > 0 && (
        <div className="rec-doctor-slots">
          <span className="rec-doctor-slots-label">Next available ({firstDay.date}):</span>
          <div className="rec-doctor-slots-list">
            {firstDay.times.slice(0, 4).map((t) => (
              <span key={t} className="rec-doctor-slot-chip">{t}</span>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="rec-doctor-book-btn" onClick={() => setShowBooking(true)}>
        Book appointment
      </button>

      {showBooking && (
        <BookingModal
          doctorId={doctor.doctor_id}
          doctorName={doctor.name}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}

export default RecommendedDoctorCard;