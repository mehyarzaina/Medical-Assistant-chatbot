import { useState } from "react";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import { requestCode, verifyCode, getMyAppointments } from "../api";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import { formatDateISO } from "../utils/date";
import "./MyAppointments.css";

const STEP = { EMAIL: "email", CODE: "code", LIST: "list" };

export default function MyAppointments() {
  const { t, lang } = useLanguage();
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
      // Soonest first.
      appts.sort((a, b) => `${a.date}`.localeCompare(`${b.date}`));
      setAppointments(appts);
      setStep(STEP.LIST);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-narrow myapts-page">
      <BackButton />
      <header className="page-head">
        <p className="page-eyebrow">{t("myAppointments.eyebrow")}</p>
        <h1 className="page-title">{t("myAppointments.title")}</h1>
        <p className="page-lede">{t("myAppointments.lede")}</p>
      </header>

      {step === STEP.EMAIL && (
        <form className="panel myapts-form" onSubmit={handleRequestCode}>
          <h2 className="panel-title">
            <span className="panel-step" aria-hidden="true">1</span>{t("myAppointments.emailIntro")}
          </h2>
          <div className="field">
            <label htmlFor="myapts-email" className="field-label">{t("myAppointments.emailLabel")}</label>
            <input
              id="myapts-email"
              className="input"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t("myAppointments.sending") : t("myAppointments.sendCode")}
          </button>
        </form>
      )}

      {step === STEP.CODE && (
        <form className="panel myapts-form" onSubmit={handleVerifyCode}>
          <h2 className="panel-title">
            <span className="panel-step" aria-hidden="true">2</span>{t("myAppointments.codeIntro", { email })}
          </h2>
          <div className="field">
            <label htmlFor="myapts-code" className="field-label">{t("myAppointments.codeLabel")}</label>
            <input
              id="myapts-code"
              className="input myapts-code"
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
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="actions-row myapts-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t("myAppointments.verifying") : t("myAppointments.verify")}
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => { setStep(STEP.EMAIL); setCode(""); setError(null); }}
            >
              {t("myAppointments.otherEmail")}
            </button>
          </div>
        </form>
      )}

      {step === STEP.LIST && (
        <>
          <p className="status-text" aria-live="polite">
            {appointments.length === 0
              ? t("myAppointments.none")
              : t("myAppointments.count", { count: appointments.length, email })}
          </p>
          <ul className="myapts-list align-page">
            {appointments.map((appt) => (
              <li className="myapts-item" key={appt.appointment_id}>
                <div className="myapts-date" aria-hidden="true">
                  <span className="myapts-date-day">{formatDateISO(appt.date, lang, { day: "numeric" })}</span>
                  <span className="myapts-date-month">{formatDateISO(appt.date, lang, { month: "short" })}</span>
                </div>
                <div className="myapts-item-info">
                  <strong dir="auto">{appt.doctor_name}</strong>
                  <span className="myapts-when">
                    {formatDateISO(appt.date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    {" · "}
                    <span dir="ltr">{appt.time}</span>
                  </span>
                  <span className={`status-pill is-${appt.status}`}>
                    {t(`myAppointments.status.${appt.status}`)}
                  </span>
                </div>
                {appt.status === "confirmed" && (
                  <div className="myapts-item-actions">
                    <Link
                      className="btn btn-ghost btn-sm"
                      to={`/appointments/${appt.appointment_id}/reschedule?token=${appt.access_token}`}
                    >
                      {t("myAppointments.reschedule")}
                    </Link>
                    <Link
                      className="text-link myapts-cancel"
                      to={`/appointments/${appt.appointment_id}/cancel?token=${appt.access_token}`}
                    >
                      {t("myAppointments.cancel")}
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
