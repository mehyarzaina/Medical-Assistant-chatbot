import { useEffect, useState } from 'react';
import { getDoctor, getDoctorInsurance, getDoctorAvailability } from '../api';
import AvailabilitySchedule from './AvailabilitySchedule';
import BookingModal from './BookingModal';
import './DoctorDetail.css';

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
}

function DoctorDetail({ doctorId, onClose }) {
  const [doctor, setDoctor] = useState(null);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getDoctor(doctorId), getDoctorInsurance(doctorId), getDoctorAvailability(doctorId)])
      .then(([doctorData, insuranceData, availabilityData]) => {
        if (cancelled) return;
        setDoctor(doctorData);
        setInsuranceCompanies(insuranceData.insurance_companies || []);
        setSchedule(availabilityData.schedule || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [doctorId]);

  return (
    <div className="doctor-detail-overlay" onClick={onClose}>
      <div className="doctor-detail-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="doctor-detail-close" onClick={onClose}>✕</button>

        {loading && <p className="doctor-detail-status">Loading…</p>}

        {!loading && doctor && (
          <>
            <div className="doctor-detail-header">
              <div className="doctor-avatar doctor-avatar-lg">{getInitials(doctor.name)}</div>
              <div>
                <h2>{doctor.name}</h2>
                {doctor.specialty && <span className="doctor-specialty-tag">{doctor.specialty}</span>}
              </div>
            </div>

            {doctor.location && <p className="doctor-detail-row">📍 {doctor.location}</p>}
            {doctor.phone && <p className="doctor-detail-row">📞 {doctor.phone}</p>}
            {doctor.about && <p className="doctor-detail-about">{doctor.about}</p>}

            <div className="doctor-detail-availability">
              <h4>Availability</h4>
              <AvailabilitySchedule schedule={schedule} loading={false} />
            </div>

            {insuranceCompanies.length > 0 && (
              <div className="doctor-detail-insurance">
                <h4>Accepted insurance</h4>
                <div className="insurance-tag-list">
                  {insuranceCompanies.map((name) => (
                    <span key={name} className="insurance-tag">{name}</span>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="doctor-detail-book-btn" onClick={() => setShowBooking(true)}>
              Book appointment
            </button>
          </>
        )}

        {showBooking && (
          <BookingModal
            doctorId={doctor.doctor_id}
            doctorName={doctor.name}
            onClose={() => setShowBooking(false)}
          />
        )}
      </div>
    </div>
  );
}

export default DoctorDetail;