import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import './Sidebar.css';

const links = [
  { to: '/', key: 'home', end: true },
  { to: '/chat', key: 'chat' },
  { to: '/doctors', key: 'doctors' },
  { to: '/appointments', key: 'appointments' },
  { to: '/about', key: 'about' },
];

// Simple medical-cross mark; decorative, the brand name next to it carries the meaning.
function LogoMark() {
  return (
    <span className="sidebar-logo-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z" />
      </svg>
    </span>
  );
}

function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useLanguage();
  const next = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`}
      onClick={() => setLang(next)}
      lang={next}
      aria-label={t('langToggle.aria')}
    >
      {t('langToggle.label')}
    </button>
  );
}

function Sidebar() {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeDrawer = () => setMobileOpen(false);

  // Close the drawer on Escape (links close it on click).
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      <header className="sidebar-topbar">
        <Link to="/" className="sidebar-topbar-logo" onClick={closeDrawer}>
          <LogoMark />
          <span>{t('brand')}</span>
        </Link>
        <div className="sidebar-topbar-actions">
          <LanguageToggle className="lang-toggle-topbar" />
          <button
            type="button"
            className={`sidebar-toggle-btn ${mobileOpen ? 'is-open' : ''}`}
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileOpen}
            aria-controls="site-sidebar"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeDrawer} aria-hidden="true" />
      )}

      <nav
        id="site-sidebar"
        className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}
        aria-label={t('nav.label')}
      >
        <Link to="/" className="sidebar-logo" onClick={closeDrawer}>
          <LogoMark />
          <span>{t('brand')}</span>
        </Link>
        <ul className="sidebar-links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeDrawer}
              >
                {t(`nav.${link.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <LanguageToggle className="lang-toggle-sidebar" />
          <NavLink to="/admin/login" className="sidebar-admin-link" onClick={closeDrawer}>
            {t('nav.admin')}
          </NavLink>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
