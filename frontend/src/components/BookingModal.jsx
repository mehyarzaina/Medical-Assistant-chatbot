import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableSlots, bookAppointment } from '../api';
import { useLanguage } from '../i18n/useLanguage';
import Modal from './Modal';
import SlotPicker from './SlotPicker';
import { todayISO } from '../utils/date';
import './BookingModal.css';

function BookingModal({ doctorId, doctorName, onClose }) {
  const { t } = useLanguage();
  const titleId = useId();
  const slotsLabelId = useId();
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState(null);

  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Re-fetch slots whenever the date changes, and reset any previously picked time
  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedTime(null);

    getAvailableSlots(doctorId, date)
      .then((data) => {
        if (cancelled) return;
        // Backend may return a plain array of time strings, or an array of
        // {date, time} objects, or {times: [...]} — this normalizes all three
        // down to a plain array of time strings.
        const raw = data.times || data || [];
        const times = raw.map((s) => (typeof s === 'string' ? s : s.time));
        setSlots(times);
      })
      .catch((err) => { if (!cancelled) setSlotsError(err.message); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [doctorId, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bookAppointment({
        doctor_id: doctorId,
        date,
        time: selectedTime,
        patient: {
          name: patientName.trim(),
          email: patientEmail.trim(),
          phone: patientPhone.trim(),
        },
      });
      setConfirmed(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeButton = (
    <button type="button" className="booking-close" onClick={onClose} aria-label={t('common.close')}>
      <span aria-hidden="true">✕</span>
    </button>
  );

  if (confirmed) {
    return (
      <Modal labelledBy={titleId} onClose={onClose} overlayClassName="booking-overlay" panelClassName="booking-panel">
        {closeButton}
        <div className="booking-success" role="status">
          <div className="booking-success-icon" aria-hidden="true">✓</div>
          <h2 id={titleId}>{t('booking.successTitle')}</h2>
          <p>{t('booking.successBody', { name: doctorName, date, time: selectedTime })}</p>
          <p className="booking-success-note">{t('booking.successEmail', { email: patientEmail })}</p>
          <button type="button" className="booking-submit-btn" onClick={onClose}>{t('booking.done')}</button>
        </div>
      </Modal>
    );
  }

  const [consentBefore, consentAfter] = t('booking.consent').split('{privacy}');

  return (
    <Modal labelledBy={titleId} onClose={onClose} overlayClassName="booking-overlay" panelClassName="booking-panel">
      {closeButton}
      <h2 id={titleId}>{t('booking.title', { name: doctorName })}</h2>

      <label className="booking-label" htmlFor="booking-date">{t('booking.date')}</label>
      <input
        id="booking-date"
        type="date"
        className="booking-date-input"
        min={todayISO()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <SlotPicker
        slots={slots}
        selectedTime={selectedTime}
        onSelect={setSelectedTime}
        loading={slotsLoading}
        error={slotsError}
        labelId={slotsLabelId}
      />

      {selectedTime && (
        <form className="booking-form" onSubmit={handleSubmit}>
          <label className="booking-label" htmlFor="patient-name">{t('booking.name')}</label>
          <input
            id="patient-name"
            type="text"
            required
            autoComplete="name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />

          <label className="booking-label" htmlFor="patient-email">{t('booking.email')}</label>
          <input
            id="patient-email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            aria-describedby="patient-email-hint"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
          />
          <p className="booking-hint" id="patient-email-hint">{t('booking.emailHint')}</p>

          <label className="booking-label" htmlFor="patient-phone">{t('booking.phone')}</label>
          <input
            id="patient-phone"
            type="tel"
            required
            autoComplete="tel"
            dir="ltr"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
          />

          <div className="booking-consent">
            <input
              id="booking-consent"
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="booking-consent">
              {consentBefore}
              <Link to="/privacy" target="_blank" rel="noopener">{t('booking.consentPrivacy')}</Link>
              {consentAfter}
            </label>
          </div>

          {submitError && <p className="booking-status booking-error" role="alert">{submitError}</p>}

          <button type="submit" className="booking-submit-btn" disabled={submitting || !consent}>
            {submitting ? t('booking.submitting') : t('booking.submit', { time: selectedTime })}
          </button>
        </form>
      )}
    </Modal>
  );
}

export default BookingModal;
