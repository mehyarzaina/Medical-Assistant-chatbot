import { useEffect, useId, useState } from 'react';
import { getDoctor, getDoctorInsurance, getDoctorAvailability } from '../api';
import { useLanguage } from '../i18n/useLanguage';
import AvailabilitySchedule from './AvailabilitySchedule';
import BookingModal from './BookingModal';
import Modal from './Modal';
import { getInitials } from '../utils/doctor';
import './DoctorDetail.css';

function DoctorDetail({ doctorId, onClose }) {
  const { t } = useLanguage();
  const titleId = useId();
  const [doctor, setDoctor] = useState(null);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([getDoctor(doctorId), getDoctorInsurance(doctorId), getDoctorAvailability(doctorId)])
      .then(([doctorData, insuranceData, availabilityData]) => {
        if (cancelled) return;
        setDoctor(doctorData);
        setInsuranceCompanies(insuranceData.insurance_companies || []);
        setSchedule(availabilityData.schedule || []);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [doctorId]);

  return (
    <Modal
      labelledBy={titleId}
      onClose={onClose}
      overlayClassName="doctor-detail-overlay"
      panelClassName="doctor-detail-panel"
    >
      <button type="button" className="doctor-detail-close" onClick={onClose} aria-label={t('common.close')}>
        <span aria-hidden="true">✕</span>
      </button>

      {loading && <p className="doctor-detail-status" role="status">{t('common.loading')}</p>}
      {!loading && error && (
        <p className="doctor-detail-status doctor-detail-error" role="alert" id={titleId}>{t('doctor.loadError')}</p>
      )}

      {!loading && doctor && (
        <>
          <div className="doctor-detail-header">
            <div className="doctor-avatar doctor-avatar-lg" aria-hidden="true">{getInitials(doctor.name)}</div>
            <div>
              <h2 id={titleId} dir="auto">{doctor.name}</h2>
              {doctor.specialty && <span className="doctor-specialty-tag" dir="auto">{doctor.specialty}</span>}
            </div>
          </div>

          <dl className="doctor-detail-facts">
            {doctor.location && (
              <div>
                <dt>{t('doctor.location')}</dt>
                <dd dir="auto">{doctor.location}</dd>
              </div>
            )}
            {doctor.phone && (
              <div>
                <dt>{t('doctor.phone')}</dt>
                <dd dir="ltr">{doctor.phone}</dd>
              </div>
            )}
          </dl>
          {doctor.about && <p className="doctor-detail-about" dir="auto">{doctor.about}</p>}

          <div className="doctor-detail-availability">
            <h3>{t('doctor.availability')}</h3>
            <AvailabilitySchedule schedule={schedule} loading={false} />
          </div>

          {insuranceCompanies.length > 0 && (
            <div className="doctor-detail-insurance">
              <h3>{t('doctor.insurance')}</h3>
              <ul className="insurance-tag-list">
                {insuranceCompanies.map((name) => (
                  <li key={name} className="insurance-tag" dir="auto">{name}</li>
                ))}
              </ul>
            </div>
          )}

          <button type="button" className="doctor-detail-book-btn" onClick={() => setShowBooking(true)}>
            {t('doctor.book')}
          </button>
        </>
      )}

      {showBooking && doctor && (
        <BookingModal
          doctorId={doctor.doctor_id}
          doctorName={doctor.name}
          onClose={() => setShowBooking(false)}
        />
      )}
    </Modal>
  );
}

export default DoctorDetail;
