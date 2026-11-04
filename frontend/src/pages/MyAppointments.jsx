import { useState } from "react";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { requestCode, verifyCode, getMyAppointments } from "../api";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import "./MyAppointments.css";

const STEP = { EMAIL: "email", CODE: "code", LIST: "list" };

export default function MyAppointments() {
  const { t } = useLanguage();
  usePageTitle("appointments");
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
      await requestCode(email.trim());
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
      const { session_token } = await verifyCode(email.trim(), code.trim());
      const appts = await getMyAppointments(email.trim(), session_token);
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
      <h1>{t("myAppointments.title")}</h1>

      {step === STEP.EMAIL && (
        <form className="myapts-card" onSubmit={handleRequestCode}>
          <p>{t("myAppointments.emailIntro")}</p>
          <label htmlFor="myapts-email" className="myapts-label">{t("myAppointments.emailLabel")}</label>
          <input
            id="myapts-email"
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="myapts-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? t("myAppointments.sending") : t("myAppointments.sendCode")}
          </button>
        </form>
      )}

      {step === STEP.CODE && (
        <form className="myapts-card" onSubmit={handleVerifyCode}>
          <p>{t("myAppointments.codeIntro", { email })}</p>
          <label htmlFor="myapts-code" className="myapts-label">{t("myAppointments.codeLabel")}</label>
          <input
            id="myapts-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            dir="ltr"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error && <p className="myapts-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? t("myAppointments.verifying") : t("myAppointments.verify")}
          </button>
          <button
            type="button"
            className="myapts-link-button"
            onClick={() => { setStep(STEP.EMAIL); setCode(""); setError(null); }}
          >
            {t("myAppointments.otherEmail")}
          </button>
        </form>
      )}

      {step === STEP.LIST && (
        <ul className="myapts-list">
          {appointments.length === 0 && <li className="myapts-empty">{t("myAppointments.none")}</li>}
          {appointments.map((appt) => (
            <li className="myapts-item" key={appt.appointment_id}>
              <div className="myapts-item-info">
                <strong dir="auto">{appt.doctor_name}</strong>
                <span dir="ltr">{appt.date} · {appt.time}</span>
                <span className={`myapts-status myapts-status-${appt.status}`}>
                  {t(`myAppointments.status.${appt.status}`)}
                </span>
              </div>
              {appt.status === "confirmed" && (
                <div className="myapts-item-actions">
                  <Link to={`/appointments/${appt.appointment_id}/reschedule?token=${appt.access_token}`}>
                    {t("myAppointments.reschedule")}
                  </Link>
                  <Link to={`/appointments/${appt.appointment_id}/cancel?token=${appt.access_token}`}>
                    {t("myAppointments.cancel")}
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
