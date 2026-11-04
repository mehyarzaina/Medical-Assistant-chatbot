import { useState, useEffect, useId } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getAppointment, rescheduleAppointment, getDoctorAvailability } from "../api";
import BackButton from "../components/BackButton";
import DayPicker from "../components/DayPicker";
import SlotPicker from "../components/SlotPicker";
import { useSlots } from "../hooks/useDoctorData";
import { formatDateISO, todayISO, workingWeekdays } from "../utils/date";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";

export default function Reschedule() {
  const { t, lang } = useLanguage();
  usePageTitle("reschedule");
  const slotsLabelId = useId();
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [appointment, setAppointment] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loadingAppointment, setLoadingAppointment] = useState(!!token);
  const [loadError, setLoadError] = useState(null);

  const [date, setDate] = useState(todayISO());
  const [selectedTime, setSelectedTime] = useState(null);
  const slots = useSlots(appointment?.doctor_id, appointment ? date : null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  // Load the existing appointment first (needs doctor_id for slot lookups)
  useEffect(() => {
    if (!token) return;
    getAppointment(appointmentId, token)
      .then((appt) => {
        setAppointment(appt);
        // Weekly hours only grey out closed days; booking still works without them.
        return getDoctorAvailability(appt.doctor_id)
          .then((data) => setSchedule(data.schedule || []))
          .catch(() => {});
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoadingAppointment(false));
  }, [appointmentId, token]);

  function changeDate(iso) {
    setDate(iso);
    setSelectedTime(null);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await rescheduleAppointment(appointmentId, token, date, selectedTime);
      setConfirmed(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const error = token ? loadError : t("reschedule.missingToken");

  if (loadingAppointment) {
    return <div className="page page-narrow"><p className="status-text" role="status">{t("common.loading")}</p></div>;
  }
  if (error) {
    return (
      <div className="page page-narrow">
        <div className="panel">
          <p className="form-error" role="alert">{error}</p>
          <Link to="/appointments" className="btn btn-primary btn-sm">{t("nav.appointments")}</Link>
        </div>
      </div>
    );
  }

  const longDate = (iso) => formatDateISO(iso, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (confirmed) {
    return (
      <div className="page page-narrow align-page">
        <div className="panel" role="status">
          <div className="result-icon" aria-hidden="true">✓</div>
          <h1 className="page-title">{t("reschedule.successTitle")}</h1>
          <dl className="facts">
            <div><dt>{t("booking.doctor")}</dt><dd dir="auto">{appointment.doctor_name}</dd></div>
            <div><dt>{t("booking.when")}</dt><dd>{longDate(date)}</dd></div>
            <div><dt>{t("booking.time")}</dt><dd dir="ltr">{selectedTime}</dd></div>
          </dl>
          <div className="actions-row">
            <Link to="/appointments" className="btn btn-primary">{t("booking.viewAppointments")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow align-page">
      <BackButton fallback="/appointments" />
      <header className="page-head">
        <p className="page-eyebrow">{t("reschedule.eyebrow")}</p>
        <h1 className="page-title">{t("reschedule.title", { name: appointment.doctor_name })}</h1>
      </header>

      <section className="panel panel-dark" aria-labelledby="reschedule-current">
        <h2 className="panel-title" id="reschedule-current">{t("reschedule.currentLabel")}</h2>
        <dl className="facts">
          <div><dt>{t("booking.when")}</dt><dd>{longDate(appointment.date)}</dd></div>
          <div><dt>{t("booking.time")}</dt><dd dir="ltr">{appointment.time}</dd></div>
        </dl>
      </section>

      <section className="panel" aria-labelledby="reschedule-new">
        <h2 className="panel-title" id="reschedule-new">{t("reschedule.newLabel")}</h2>
        <DayPicker value={date} onChange={changeDate} workingDays={workingWeekdays(schedule)} />
        <SlotPicker
          slots={slots.slots}
          selectedTime={selectedTime}
          onSelect={setSelectedTime}
          loading={slots.loading}
          error={slots.error}
          labelId={slotsLabelId}
        />

        {submitError && <p className="form-error" role="alert">{submitError}</p>}

        <button
          type="button"
          className="btn btn-primary btn-block reschedule-submit"
          disabled={!selectedTime || submitting}
          onClick={handleConfirm}
        >
          {submitting
            ? t("reschedule.submitting")
            : selectedTime
              ? t("reschedule.confirm", { time: selectedTime })
              : t("reschedule.pick")}
        </button>
      </section>
    </div>
  );
}
