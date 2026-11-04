import { Link } from 'react-router-dom';
import NetworkCanvas from '../components/NetworkCanvas';
import { useLanguage } from '../i18n/useLanguage';
import usePageTitle from '../hooks/usePageTitle';
import './Welcome.css';

function Welcome() {
  const { t } = useLanguage();
  usePageTitle('home');
  const steps = t('welcome.steps');
  const features = t('welcome.features');

  return (
    <div className="welcome-page">
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <NetworkCanvas />
        <div className="welcome-hero-content">
          <span className="welcome-eyebrow">{t('welcome.eyebrow')}</span>
          <h1 id="welcome-title">{t('welcome.title')}</h1>
          <p className="welcome-lede">{t('welcome.lede')}</p>
          <div className="welcome-hero-actions">
            <Link to="/chat" className="welcome-cta">{t('welcome.ctaChat')}</Link>
            <Link to="/doctors" className="welcome-cta welcome-cta-outline">{t('welcome.ctaDoctors')}</Link>
          </div>
        </div>

        <a href="#how-it-works" className="welcome-scroll-cue" aria-label={t('welcome.scroll')}>
          <span className="welcome-scroll-cue-icon" aria-hidden="true">
            <span className="welcome-scroll-chevron" />
            <span className="welcome-scroll-chevron" />
          </span>
        </a>
      </section>

      <section id="how-it-works" className="welcome-info-section">
        <div className="welcome-steps">
          <h2>{t('welcome.howTitle')}</h2>
          <p className="welcome-section-lede">{t('welcome.howLede')}</p>
          <ol className="steps-grid">
            {steps.map((step, i) => (
              <li className="step-card" key={step.title}>
                <span className="step-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="welcome-explainer">
          <h2>{t('welcome.featuresTitle')}</h2>
          <p className="welcome-section-lede">{t('welcome.featuresLede')}</p>
          <ul className="explainer-grid">
            {features.map((f) => (
              <li className="explainer-card" key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="welcome-closing-section">
        <div className="welcome-trust">
          <div className="welcome-trust-inner">
            <h2>{t('welcome.noticeTitle')}</h2>
            <p>{t('welcome.noticeBody')}</p>
          </div>
        </div>

        <div className="welcome-final-cta">
          <h2>{t('welcome.finalTitle')}</h2>
          <div className="welcome-final-cta-actions">
            <Link to="/chat" className="welcome-cta">{t('welcome.ctaChat')}</Link>
            <Link to="/doctors" className="welcome-cta welcome-cta-outline">{t('welcome.ctaDoctors')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Welcome;
