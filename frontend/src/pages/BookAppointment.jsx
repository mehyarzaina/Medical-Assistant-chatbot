import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import DayPicker from '../components/DayPicker';
import SlotPicker from '../components/SlotPicker';
import { bookAppointment } from '../api';
import { useDoctor, useSlots } from '../hooks/useDoctorData';
import { useLanguage } from '../i18n/useLanguage';
import usePageTitle from '../hooks/usePageTitle';
import { addDaysISO, formatDateISO, todayISO, weekdayOfISO, workingWeekdays } from '../utils/date';
import './BookAppointment.css';

// First day in the next two weeks the doctor works (today if hours are unknown).
function firstOpenDay(workingDays) {
  const today = todayISO();
  if (workingDays.size === 0) return today;
  for (let i = 0; i < 14; i += 1) {
    const iso = addDaysISO(today, i);
    if (workingDays.has(weekdayOfISO(iso))) return iso;
  }
  return today;
}

export default function BookAppointment() {
  const { t, lang } = useLanguage();
  usePageTitle('book');
  const { doctorId } = useParams();
  const slotsLabelId = useId();
  const { doctor, schedule, loading, error } = useDoctor(doctorId);
  const workingDays = workingWeekdays(schedule);

  const [pickedDate, setPickedDate] = useState(null);
  const date = pickedDate ?? (doctor ? firstOpenDay(workingDays) : null);
  const [selectedTime, setSelectedTime] = useState(null);
  const slots = useSlots(doctor ? doctorId : null, date);

  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  function changeDate(iso) {
    setPickedDate(iso);
    setSelectedTime(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!consent || !selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bookAppointment({
        doctor_id: doctorId,
        date,
        time: selectedTime,
        patient: {
          name: patientName.trim(),
          email: patientEmail.trim(),
          phone: patientPhone.trim(),
        },
      });
      setConfirmed(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="page"><p className="status-text" role="status">{t('common.loading')}</p></div>;
  }
  if (error || !doctor) {
    return (
      <div className="page page-narrow">
        <BackButton fallback="/doctors" />
        <div className="panel">
          <h1 className="page-title">{t('doctor.loadError')}</h1>
          <Link to="/doctors" className="btn btn-primary btn-sm">{t('doctor.allDoctors')}</Link>
        </div>
      </div>
    );
  }

  const longDate = formatDateISO(date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (confirmed) {
    return (
      <div className="page page-narrow align-page">
        <div className="panel book-done" role="status">
          <div className="result-icon" aria-hidden="true">✓</div>
          <h1 className="page-title">{t('booking.successTitle')}</h1>
          <dl className="facts">
            <div><dt>{t('booking.doctor')}</dt><dd dir="auto">{doctor.name}</dd></div>
            <div><dt>{t('booking.when')}</dt><dd>{longDate}</dd></div>
            <div><dt>{t('booking.time')}</dt><dd dir="ltr">{selectedTime}</dd></div>
          </dl>
          <p className="book-done-note">{t('booking.successEmail', { email: patientEmail })}</p>
          <div className="actions-row">
            <Link to="/appointments" className="btn btn-primary">{t('booking.viewAppointments')}</Link>
            <Link to="/doctors" className="btn btn-ghost">{t('booking.findAnother')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const [consentBefore, consentAfter] = t('booking.consent').split('{privacy}');

  return (
    <div className="page book-page align-page">
      <BackButton fallback={`/doctors/${doctorId}`} />

      <header className="page-head">
        <p className="page-eyebrow">{t('booking.eyebrow')}</p>
        <h1 className="page-title" dir="auto">{doctor.name}</h1>
        {doctor.specialty && <span className="tag" dir="auto">{doctor.specialty}</span>}
      </header>

      <div className="page-split">
        <form className="book-form" onSubmit={handleSubmit}>
          <section className="panel" aria-labelledby="book-step-when">
            <h2 className="panel-title" id="book-step-when">
              <span className="panel-step" aria-hidden="true">1</span>{t('booking.stepWhen')}
            </h2>
            <DayPicker value={date} onChange={changeDate} workingDays={workingDays} />
            <SlotPicker
              slots={slots.slots}
              selectedTime={selectedTime}
              onSelect={setSelectedTime}
              loading={slots.loading}
              error={slots.error}
              labelId={slotsLabelId}
            />
          </section>

          <section className="panel" aria-labelledby="book-step-details">
            <h2 className="panel-title" id="book-step-details">
              <span className="panel-step" aria-hidden="true">2</span>{t('booking.stepDetails')}
            </h2>

            <div className="book-fields">
              <div className="field">
                <label className="field-label" htmlFor="patient-name">{t('booking.name')}</label>
                <input
                  id="patient-name"
                  className="input"
                  type="text"
                  required
                  autoComplete="name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="patient-phone">{t('booking.phone')}</label>
                <input
                  id="patient-phone"
                  className="input"
                  type="tel"
                  required
                  autoComplete="tel"
                  dir="ltr"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>

              <div className="field book-field-wide">
                <label className="field-label" htmlFor="patient-email">{t('booking.email')}</label>
                <input
                  id="patient-email"
                  className="input"
                  type="email"
                  required
                  autoComplete="email"
                  dir="ltr"
                  aria-describedby="patient-email-hint"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
                <p className="field-hint" id="patient-email-hint">{t('booking.emailHint')}</p>
              </div>
            </div>

            <div className="booking-consent">
              <input
                id="booking-consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <label htmlFor="booking-consent">
                {consentBefore}
                <Link to="/privacy" target="_blank" rel="noopener">{t('booking.consentPrivacy')}</Link>
                {consentAfter}
              </label>
            </div>

            {submitError && <p className="form-error" role="alert">{submitError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-block book-submit"
              disabled={submitting || !consent || !selectedTime}
            >
              {submitting
                ? t('booking.submitting')
                : selectedTime
                  ? t('booking.submit', { time: selectedTime })
                  : t('booking.pickTimeFirst')}
            </button>
          </section>
        </form>

        <aside className="page-aside">
          <div className="panel panel-dark" aria-live="polite">
            <h2 className="panel-title">{t('booking.summary')}</h2>
            <dl className="facts">
              <div><dt>{t('booking.doctor')}</dt><dd dir="auto">{doctor.name}</dd></div>
              <div><dt>{t('booking.when')}</dt><dd>{longDate}</dd></div>
              <div>
                <dt>{t('booking.time')}</dt>
                <dd dir={selectedTime ? 'ltr' : undefined} className={selectedTime ? '' : 'book-pending'}>
                  {selectedTime ?? t('booking.notChosen')}
                </dd>
              </div>
              {doctor.location && (
                <div><dt>{t('doctor.location')}</dt><dd dir="auto">{doctor.location}</dd></div>
              )}
            </dl>
            <p className="book-summary-note">{t('booking.summaryNote')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
