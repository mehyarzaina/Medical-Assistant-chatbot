import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import { useLanguage } from '../i18n/useLanguage';
import usePageTitle from '../hooks/usePageTitle';
import useReveal from '../hooks/useReveal';
import './Welcome.css';

function Welcome() {
  const { t } = useLanguage();
  usePageTitle('home');
  const steps = t('welcome.steps');
  const features = t('welcome.features');
  const howRef = useReveal();
  const featuresRef = useReveal();
  const closingRef = useReveal();

  return (
    <div className="welcome-page">
      <HeroSlider />

      <section id="how-it-works" className="home-section home-how reveal" ref={howRef} aria-labelledby="how-title">
        <div className="home-section-head">
          <p className="home-eyebrow">{t('welcome.howEyebrow')}</p>
          <h2 id="how-title">{t('welcome.howTitle')}</h2>
          <p className="home-section-lede">{t('welcome.howLede')}</p>
        </div>
        <ol className="home-timeline">
          {steps.map((step, i) => (
            <li key={step.title} style={{ '--i': i }}>
              <span className="home-timeline-dot" aria-hidden="true">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section home-features reveal" ref={featuresRef} aria-labelledby="features-title">
        <div className="home-features-intro">
          <p className="home-eyebrow">{t('welcome.featuresEyebrow')}</p>
          <h2 id="features-title">{t('welcome.featuresTitle')}</h2>
          <p className="home-section-lede">{t('welcome.featuresLede')}</p>
          <Link to="/doctors" className="btn btn-ghost">{t('welcome.ctaDoctors')}</Link>
        </div>
        <ul className="home-feature-list">
          {features.map((f, i) => (
            <li key={f.title} style={{ '--i': i }}>
              <span className="home-feature-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-closing reveal" ref={closingRef} aria-labelledby="closing-title">
        <div className="home-closing-inner">
          <div>
            <h2 id="closing-title">{t('welcome.finalTitle')}</h2>
            <p>{t('welcome.finalBody')}</p>
          </div>
          <div className="home-closing-actions">
            <Link to="/chat" className="btn btn-light">{t('welcome.ctaChat')}</Link>
            <Link to="/doctors" className="btn btn-outline-light">{t('welcome.ctaDoctors')}</Link>
          </div>
        </div>
        <p className="home-notice">
          <strong>{t('welcome.noticeTitle')}.</strong> {t('welcome.noticeBody')}
        </p>
      </section>
    </div>
  );
}

export default Welcome;
