import { Link, useParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import AvailabilitySchedule from '../components/AvailabilitySchedule';
import { useDoctor } from '../hooks/useDoctorData';
import { useLanguage } from '../i18n/useLanguage';
import usePageTitle from '../hooks/usePageTitle';
import './DoctorProfile.css';

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export default function DoctorProfile() {
  const { t } = useLanguage();
  usePageTitle('doctor');
  const { doctorId } = useParams();
  const { doctor, schedule, insurance, loading, error } = useDoctor(doctorId);
  const bookPath = `/doctors/${doctorId}/book`;

  return (
    <div className="page profile-page align-page">
      <BackButton fallback="/doctors" />

      {loading && <p className="status-text" role="status">{t('common.loading')}</p>}
      {error && (
        <div className="panel">
          <h1 className="page-title">{t('doctor.loadError')}</h1>
          <Link to="/doctors" className="btn btn-primary btn-sm">{t('doctor.allDoctors')}</Link>
        </div>
      )}

      {doctor && (
        <>
          <header className="profile-hero">
            <div className="profile-hero-text">
              <p className="page-eyebrow">{t('doctor.eyebrow')}</p>
              <h1 className="page-title" dir="auto">{doctor.name}</h1>
              <div className="profile-meta">
                {doctor.specialty && <span className="tag" dir="auto">{doctor.specialty}</span>}
                {doctor.location && (
                  <span className="profile-location">
                    <PinIcon />
                    <span className="visually-hidden">{t('doctor.location')}: </span>
                    <span dir="auto">{doctor.location}</span>
                  </span>
                )}
              </div>
            </div>
            <Link to={bookPath} className="btn btn-primary profile-hero-cta">{t('doctor.book')}</Link>
          </header>

          <div className="page-split">
            <div className="profile-main">
              <section className="panel" aria-labelledby="profile-about">
                <h2 className="panel-title" id="profile-about">{t('doctor.about')}</h2>
                <p className="profile-about" dir="auto">{doctor.about || t('doctor.noAbout')}</p>
              </section>

              <section className="panel" aria-labelledby="profile-hours">
                <h2 className="panel-title" id="profile-hours">{t('doctor.availability')}</h2>
                <AvailabilitySchedule schedule={schedule} loading={false} />
              </section>

              <section className="panel" aria-labelledby="profile-insurance">
                <h2 className="panel-title" id="profile-insurance">{t('doctor.insurance')}</h2>
                {insurance.length > 0 ? (
                  <ul className="profile-insurance">
                    {insurance.map((name) => (
                      <li key={name} className="tag tag-plain" dir="auto">{name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="status-text">{t('doctor.noInsurance')}</p>
                )}
              </section>
            </div>

            <aside className="page-aside">
              <div className="panel panel-dark">
                <h2 className="panel-title">{t('doctor.bookTitle')}</h2>
                <p className="profile-book-body">{t('doctor.bookBody')}</p>
                {doctor.phone && (
                  <dl className="facts profile-book-facts">
                    <div>
                      <dt>{t('doctor.phone')}</dt>
                      <dd dir="ltr">{doctor.phone}</dd>
                    </div>
                  </dl>
                )}
                <Link to={bookPath} className="btn btn-light btn-block">{t('doctor.book')}</Link>
              </div>
              <p className="field-hint profile-data-note">{t('doctors.dataNote')}</p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
