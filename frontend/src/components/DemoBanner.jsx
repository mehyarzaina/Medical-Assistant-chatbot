import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import './DemoBanner.css';

function DemoBanner() {
  const { t } = useLanguage();
  return (
    <div className="demo-banner" role="note">
      <span>{t('demoBanner.text')}</span>{' '}
      <Link to="/terms">{t('demoBanner.link')}</Link>
    </div>
  );
}

export default DemoBanner;
