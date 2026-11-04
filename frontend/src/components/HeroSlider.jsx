import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import './HeroSlider.css';

const SLIDE_MS = 7000;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------- Product previews drawn in HTML (no stock images) ---------- */

function ChatPreview({ mock }) {
  return (
    <div className="hero-mock hero-mock-chat">
      <div className="hero-mock-bar"><span /><span /><span /></div>
      <p className="hero-bubble hero-bubble-user">{mock.user1}</p>
      <p className="hero-bubble hero-bubble-bot">{mock.bot1}</p>
      <p className="hero-bubble hero-bubble-user">{mock.user2}</p>
      <p className="hero-bubble hero-bubble-bot hero-bubble-typing" aria-hidden="true">
        <span /><span /><span />
      </p>
    </div>
  );
}

function DoctorsPreview({ mock }) {
  return (
    <div className="hero-mock hero-mock-doctors">
      <p className="hero-mock-heading">{mock.heading}</p>
      <ul>
        {mock.rows.map((row, i) => (
          <li key={row.specialty}>
            <span className="hero-mock-avatar" aria-hidden="true">{row.specialty[0]}</span>
            <span className="hero-mock-text">
              <strong>{row.specialty}</strong>
              <span>{row.meta}</span>
            </span>
            {i === 0 && <span className="hero-mock-badge">{mock.best}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlotsPreview({ mock }) {
  return (
    <div className="hero-mock hero-mock-slots">
      <p className="hero-mock-heading">{mock.date}</p>
      <div className="hero-mock-grid" dir="ltr">
        {mock.times.map((time) => (
          <span key={time} className={time === mock.selected ? 'is-selected' : ''}>{time}</span>
        ))}
      </div>
      <p className="hero-mock-toast">
        <span aria-hidden="true">✓</span> {mock.confirmed}
      </p>
    </div>
  );
}

const PREVIEWS = [ChatPreview, DoctorsPreview, SlotsPreview];

export default function HeroSlider() {
  const { t, dir } = useLanguage();
  const slides = t('welcome.slides');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [hovering, setHovering] = useState(false);
  const running = !paused && !hovering;

  const goTo = useCallback((i) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => goTo(index + 1), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [running, index, goTo]);

  function handleKeyDown(e) {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) goTo(index + 1);
    if (e.key === backward) goTo(index - 1);
  }

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label={t('welcome.carouselLabel')}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovering(false); }}
      onKeyDown={handleKeyDown}
    >
      <div className="hero-slides" aria-live={running ? 'off' : 'polite'}>
        {slides.map((slide, i) => {
          const Preview = PREVIEWS[i];
          const active = i === index;
          return (
            <div
              key={slide.title}
              className={`hero-slide ${active ? 'is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={t('welcome.slideOf', { n: i + 1, total: slides.length })}
              aria-hidden={!active}
              inert={!active}
            >
              <div className="hero-copy">
                <p className="hero-kicker">
                  <span className="hero-kicker-num">{String(i + 1).padStart(2, '0')}</span>
                  {slide.kicker}
                </p>
                {i === 0 ? <h1>{slide.title}</h1> : <h2 className="hero-title">{slide.title}</h2>}
                <p className="hero-lede">{slide.body}</p>
                <div className="hero-actions">
                  <Link to="/chat" className="btn btn-primary">{t('welcome.ctaChat')}</Link>
                  <Link to="/doctors" className="btn btn-ghost">{t('welcome.ctaDoctors')}</Link>
                </div>
              </div>
              <div className="hero-visual" aria-hidden="true">
                <Preview mock={t(`welcome.mocks.${i}`)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="hero-controls">
        <button type="button" className="hero-arrow" onClick={() => goTo(index - 1)} aria-label={t('welcome.prevSlide')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div className="hero-progress">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              className={`hero-progress-item ${i === index ? 'is-active' : ''} ${i < index ? 'is-done' : ''}`}
              onClick={() => goTo(i)}
              aria-label={t('welcome.goToSlide', { n: i + 1 })}
              aria-current={i === index ? 'true' : undefined}
            >
              <span
                // Remount on every slide change so the fill animation restarts.
                key={i === index ? `active-${index}` : 'idle'}
                className="hero-progress-fill"
                style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? 'running' : 'paused' }}
              />
            </button>
          ))}
        </div>
        <button type="button" className="hero-arrow" onClick={() => goTo(index + 1)} aria-label={t('welcome.nextSlide')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <button
          type="button"
          className="hero-pause"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
        >
          {paused ? t('welcome.play') : t('welcome.pause')}
        </button>
      </div>

      <a href="#how-it-works" className="hero-scroll" aria-label={t('welcome.scroll')}>
        <span aria-hidden="true" />
      </a>
    </section>
  );
}
