import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getAppointment, cancelAppointment } from "../api";
import "./Cancel.css";

export default function Cancel() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing access token in this link.");
      setLoading(false);
      return;
    }
    getAppointment(appointmentId, token)
      .then(setAppointment)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [appointmentId, token]);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      await cancelAppointment(appointmentId, token);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="cancel-page"><p>Loading…</p></div>;
  if (error) return <div className="cancel-page"><p className="cancel-error">{error}</p></div>;
  if (done) {
    return (
      <div className="cancel-page">
        <div className="cancel-card">
          <h1>Appointment cancelled</h1>
          <p>Your appointment with {appointment.doctor_name} has been cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cancel-page">
      <div className="cancel-card">
        <h1>Cancel appointment</h1>
        <p>
          Are you sure you want to cancel your appointment with{" "}
          <strong>{appointment.doctor_name}</strong> on{" "}
          <strong>{appointment.date}</strong> at <strong>{appointment.time}</strong>?
        </p>
        <div className="cancel-actions">
          <button className="cancel-confirm" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling…" : "Yes, cancel it"}
          </button>
        </div>
      </div>
    </div>
  );
}