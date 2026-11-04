import { useState, useEffect, useId } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getAppointment, rescheduleAppointment, getAvailableSlots } from "../api";
import SlotPicker from "../components/SlotPicker";
import { todayISO } from "../utils/date";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import "../components/BookingModal.css"; // reuse the same slot/date/button styling
import "./Reschedule.css";

export default function Reschedule() {
  const { t } = useLanguage();
  usePageTitle("reschedule");
  const slotsLabelId = useId();
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
      setLoadError(t("reschedule.missingToken"));
      setLoadingAppointment(false);
      return;
    }
    getAppointment(appointmentId, token)
      .then(setAppointment)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoadingAppointment(false));
    // t is left out on purpose: switching language must not refetch the appointment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return <div className="reschedule-page"><p className="booking-status" role="status">{t("common.loading")}</p></div>;
  }
  if (loadError) {
    return <div className="reschedule-page"><p className="booking-status booking-error" role="alert">{loadError}</p></div>;
  }

  if (confirmed) {
    return (
      <div className="reschedule-page">
        <div className="reschedule-card booking-success" role="status">
          <div className="booking-success-icon" aria-hidden="true">✓</div>
          <h1>{t("reschedule.successTitle")}</h1>
          <p>{t("reschedule.successBody", { name: appointment.doctor_name, date, time: selectedTime })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reschedule-page">
      <div className="reschedule-card">
        <h1>{t("reschedule.title", { name: appointment.doctor_name })}</h1>
        <p className="reschedule-current">
          {t("reschedule.current", { date: appointment.date, time: appointment.time })}
        </p>

        <label className="booking-label" htmlFor="reschedule-date">{t("reschedule.newDate")}</label>
        <input
          id="reschedule-date"
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

        {submitError && <p className="booking-status booking-error" role="alert">{submitError}</p>}

        <button
          type="button"
          className="booking-submit-btn"
          disabled={!selectedTime || submitting}
          onClick={handleConfirm}
        >
          {submitting
            ? t("reschedule.submitting")
            : selectedTime
              ? t("reschedule.confirm", { time: selectedTime })
              : t("reschedule.pick")}
        </button>
      </div>
    </div>
  );
}
