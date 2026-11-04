import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import './BackButton.css';

function BackButton({ fallback = '/' }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1); // go back one step in browser history
    } else {
      navigate(fallback); // no history (e.g. opened from email link) — go somewhere sensible
    }
  };

  return (
    <button type="button" className="back-button" onClick={handleClick}>
      <span className="back-button-arrow" aria-hidden="true">←</span>
      {t('common.back')}
    </button>
  );
}

export default BackButton;
