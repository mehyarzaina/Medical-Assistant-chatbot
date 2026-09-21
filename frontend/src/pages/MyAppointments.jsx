import { useState } from "react";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { requestCode, verifyCode, getMyAppointments } from "../api";
import "./MyAppointments.css";

const STEP = { EMAIL: "email", CODE: "code", LIST: "list" };

export default function MyAppointments() {
  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRequestCode(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestCode(email);
      setStep(STEP.CODE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { session_token } = await verifyCode(email, code);
      const appts = await getMyAppointments(email, session_token);
      setAppointments(appts);
      setStep(STEP.LIST);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="myapts-page">
      <BackButton />
      <h1>My Appointments</h1>

      {step === STEP.EMAIL && (
        <form className="myapts-card" onSubmit={handleRequestCode}>
          <p>Enter the email you used to book, and we'll send you a verification code.</p>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="myapts-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      )}

      {step === STEP.CODE && (
        <form className="myapts-card" onSubmit={handleVerifyCode}>
          <p>Enter the 6-digit code we sent to <strong>{email}</strong>.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error && <p className="myapts-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Verifying…" : "Verify"}
          </button>
          <button
            type="button"
            className="myapts-link-button"
            onClick={() => { setStep(STEP.EMAIL); setCode(""); setError(null); }}
          >
            Use a different email
          </button>
        </form>
      )}

      {step === STEP.LIST && (
        <div className="myapts-list">
          {appointments.length === 0 && <p>No appointments found for this email.</p>}
          {appointments.map((appt) => (
            <div className="myapts-item" key={appt.appointment_id}>
              <div className="myapts-item-info">
                <strong>{appt.doctor_name}</strong>
                <span>{appt.date} · {appt.time}</span>
                <span className={`myapts-status myapts-status-${appt.status}`}>{appt.status}</span>
              </div>
              {appt.status === "confirmed" && (
                <div className="myapts-item-actions">
                  <Link to={`/appointments/${appt.appointment_id}/reschedule?token=${appt.access_token}`}>
                    Reschedule
                  </Link>
                  <Link to={`/appointments/${appt.appointment_id}/cancel?token=${appt.access_token}`}>
                    Cancel
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}