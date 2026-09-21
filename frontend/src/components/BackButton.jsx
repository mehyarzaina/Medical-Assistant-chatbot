import { useNavigate } from 'react-router-dom';
import './BackButton.css';

function BackButton({ fallback = '/' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1); // go back one step in browser history
    } else {
      navigate(fallback); // no history (e.g. opened from email link) — go somewhere sensible
    }
  };

  return (
    <button className="back-button" onClick={handleClick}>
      ← Back
    </button>
  );
}

export default BackButton;