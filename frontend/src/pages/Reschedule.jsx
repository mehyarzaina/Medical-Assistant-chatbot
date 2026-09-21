import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getAppointment, rescheduleAppointment, getAvailableSlots } from "../api";
import "../components/BookingModal.css"; // reuse the same slot/date/button styling
import "./Reschedule.css";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function Reschedule() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [appointment, setAppointment] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Load the existing appointment first (needs doctor_id for slot lookups)
  useEffect(() => {
    if (!token) {
      setLoadError("Missing access token in this link.");
      setLoadingAppointment(false);
      return;
    }
    getAppointment(appointmentId, token)
      .then(setAppointment)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoadingAppointment(false));
  }, [appointmentId, token]);

  // Same slot-fetch + normalization pattern as BookingModal
  useEffect(() => {
    if (!appointment) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedTime(null);

    getAvailableSlots(appointment.doctor_id, date)
      .then((data) => {
        if (cancelled) return;
        const raw = data.times || data || [];
        const times = raw.map((s) => (typeof s === "string" ? s : s.time));
        setSlots(times);
      })
      .catch((err) => { if (!cancelled) setSlotsError(err.message); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
  }, [appointment, date]);

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await rescheduleAppointment(appointmentId, token, date, selectedTime);
      setConfirmed(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingAppointment) {
    return <div className="reschedule-page"><p className="booking-status">Loading…</p></div>;
  }
  if (loadError) {
    return <div className="reschedule-page"><p className="booking-status booking-error">{loadError}</p></div>;
  }

  if (confirmed) {
    return (
      <div className="reschedule-page">
        <div className="reschedule-card booking-success">
          <div className="booking-success-icon">✓</div>
          <h2>Appointment rescheduled</h2>
          <p>With <strong>{appointment.doctor_name}</strong>, now on <strong>{date}</strong> at <strong>{selectedTime}</strong>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reschedule-page">
      <div className="reschedule-card">
        <h2>Reschedule with {appointment.doctor_name}</h2>
        <p className="reschedule-current">
          Currently booked for <strong>{appointment.date}</strong> at <strong>{appointment.time}</strong>.
        </p>

        <label className="booking-label" htmlFor="reschedule-date">New date</label>
        <input
          id="reschedule-date"
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
              className={`booking-slot ${selectedTime === time ? "selected" : ""}`}
              onClick={() => setSelectedTime(time)}
            >
              {time}
            </button>
          ))}
        </div>

        {submitError && <p className="booking-status booking-error">{submitError}</p>}

        <button
          type="button"
          className="booking-submit-btn"
          disabled={!selectedTime || submitting}
          onClick={handleConfirm}
        >
          {submitting ? "Rescheduling…" : selectedTime ? `Confirm for ${selectedTime}` : "Pick a time"}
        </button>
      </div>
    </div>
  );
}