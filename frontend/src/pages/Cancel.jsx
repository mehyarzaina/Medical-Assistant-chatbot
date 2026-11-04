import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getAppointment, cancelAppointment } from "../api";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import "./Cancel.css";

export default function Cancel() {
  const { t } = useLanguage();
  usePageTitle("cancel");
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
      setError(t("reschedule.missingToken"));
      setLoading(false);
      return;
    }
    getAppointment(appointmentId, token)
      .then(setAppointment)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // t is left out on purpose: switching language must not refetch the appointment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading) return <div className="cancel-page"><p role="status">{t("common.loading")}</p></div>;
  if (error && !appointment) {
    return <div className="cancel-page"><p className="cancel-error" role="alert">{error}</p></div>;
  }
  if (done) {
    return (
      <div className="cancel-page">
        <div className="cancel-card" role="status">
          <h1>{t("cancel.doneTitle")}</h1>
          <p>{t("cancel.doneBody", { name: appointment.doctor_name })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cancel-page">
      <div className="cancel-card">
        <h1>{t("cancel.title")}</h1>
        <p>
          {t("cancel.question", {
            name: appointment.doctor_name,
            date: appointment.date,
            time: appointment.time,
          })}
        </p>
        {error && <p className="cancel-error" role="alert">{error}</p>}
        <div className="cancel-actions">
          <button type="button" className="cancel-confirm" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? t("cancel.cancelling") : t("cancel.confirm")}
          </button>
          <Link to="/" className="cancel-keep">{t("cancel.keep")}</Link>
        </div>
      </div>
    </div>
  );
}
