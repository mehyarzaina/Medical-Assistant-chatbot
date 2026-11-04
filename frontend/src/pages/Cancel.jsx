import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getAppointment, cancelAppointment } from "../api";
import BackButton from "../components/BackButton";
import { formatDateISO } from "../utils/date";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";

export default function Cancel() {
  const { t, lang } = useLanguage();
  usePageTitle("cancel");
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
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

  if (loading) {
    return <div className="page page-narrow"><p className="status-text" role="status">{t("common.loading")}</p></div>;
  }
  if (!appointment) {
    return (
      <div className="page page-narrow">
        <div className="panel">
          <p className="form-error" role="alert">{token ? error : t("reschedule.missingToken")}</p>
          <Link to="/appointments" className="btn btn-primary btn-sm">{t("nav.appointments")}</Link>
        </div>
      </div>
    );
  }

  const facts = (
    <dl className="facts">
      <div><dt>{t("booking.doctor")}</dt><dd dir="auto">{appointment.doctor_name}</dd></div>
      <div>
        <dt>{t("booking.when")}</dt>
        <dd>{formatDateISO(appointment.date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd>
      </div>
      <div><dt>{t("booking.time")}</dt><dd dir="ltr">{appointment.time}</dd></div>
    </dl>
  );

  if (done) {
    return (
      <div className="page page-narrow align-page">
        <div className="panel" role="status">
          <div className="result-icon is-danger" aria-hidden="true">✕</div>
          <h1 className="page-title">{t("cancel.doneTitle")}</h1>
          {facts}
          <div className="actions-row">
            <Link to="/doctors" className="btn btn-primary">{t("booking.findAnother")}</Link>
            <Link to="/appointments" className="btn btn-ghost">{t("booking.viewAppointments")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow align-page">
      <BackButton fallback="/appointments" />
      <header className="page-head">
        <p className="page-eyebrow">{t("cancel.eyebrow")}</p>
        <h1 className="page-title">{t("cancel.title")}</h1>
        <p className="page-lede">{t("cancel.note")}</p>
      </header>

      <div className="panel">
        {facts}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="actions-row">
          <button type="button" className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? t("cancel.cancelling") : t("cancel.confirm")}
          </button>
          <Link to="/appointments" className="btn btn-ghost">{t("cancel.keep")}</Link>
        </div>
      </div>
    </div>
  );
}
