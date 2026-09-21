import { useEffect, useState } from 'react';
import { getAvailableSlots, bookAppointment } from '../api';
import './BookingModal.css';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function BookingModal({ doctorId, doctorName, onClose }) {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState(null);

  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

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
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bookAppointment({
        doctor_id: doctorId,
        date,
        time: selectedTime,
        patient: {
          name: patientName,
          email: patientEmail,
          phone: patientPhone,
        },
      });
      setConfirmed(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="booking-overlay" onClick={onClose}>
        <div className="booking-panel" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="booking-close" onClick={onClose}>✕</button>
          <div className="booking-success">
            <div className="booking-success-icon">✓</div>
            <h2>Appointment booked</h2>
            <p>With <strong>{doctorName}</strong> on <strong>{date}</strong> at <strong>{selectedTime}</strong>.</p>
            <p className="booking-success-note">A confirmation email is on its way to {patientEmail}.</p>
            <button type="button" className="booking-submit-btn" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-overlay" onClick={onClose}>
      <div className="booking-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="booking-close" onClick={onClose}>✕</button>
        <h2>Book with {doctorName}</h2>

        <label className="booking-label" htmlFor="booking-date">Date</label>
        <input
          id="booking-date"
          type="date"
          className="booking-date-input"
          min={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <p className="booking-label">Available times</p>
        {slotsLoading && <p className="booking-status">Loading slots…</p>}
        {slotsError && <p className="booking-status booking-error">Couldn't load slots: {slotsError}</p>}
        {!slotsLoading && !slotsError && slots.length === 0 && (
          <p className="booking-status">No open slots on this date — try another day.</p>
        )}
        <div className="booking-slot-grid">
          {slots.map((time) => (
            <button
              type="button"
              key={time}
              className={`booking-slot ${selectedTime === time ? 'selected' : ''}`}
              onClick={() => setSelectedTime(time)}
            >
              {time}
            </button>
          ))}
        </div>

        {selectedTime && (
          <form className="booking-form" onSubmit={handleSubmit}>
            <label className="booking-label" htmlFor="patient-name">Your name</label>
            <input
              id="patient-name"
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />

            <label className="booking-label" htmlFor="patient-email">Email</label>
            <input
              id="patient-email"
              type="email"
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />

            <label className="booking-label" htmlFor="patient-phone">Phone</label>
            <input
              id="patient-phone"
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
            />

            {submitError && <p className="booking-status booking-error">{submitError}</p>}

            <button type="submit" className="booking-submit-btn" disabled={submitting}>
              {submitting ? 'Booking…' : `Confirm for ${selectedTime}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BookingModal;