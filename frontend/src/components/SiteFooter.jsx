import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import './SiteFooter.css';

function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <nav className="site-footer-links" aria-label={t('footer.label')}>
        <Link to="/privacy">{t('footer.privacy')}</Link>
        <Link to="/terms">{t('footer.terms')}</Link>
        <Link to="/cookies">{t('footer.cookies')}</Link>
      </nav>
      <p className="site-footer-source">{t('footer.dataSource')}</p>
      <p className="site-footer-rights">{t('footer.rights', { year: new Date().getFullYear() })}</p>
    </footer>
  );
}

export default SiteFooter;
