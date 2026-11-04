import { useState, useRef, useEffect, useId } from 'react';
import { useLanguage } from '../i18n/useLanguage';
import './MultiSelectDropdown.css';

function MultiSelectDropdown({ label, options, selected, onChange }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  // Close the dropdown if the user clicks or tabs anywhere outside it
  useEffect(() => {
    function handleOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
    };
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="multiselect" ref={wrapperRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        ref={triggerRef}
        className="multiselect-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {label}
        {selected.length > 0 && (
          <span className="multiselect-count">
            <span className="visually-hidden">: </span>{selected.length}
          </span>
        )}
        <span className="multiselect-arrow" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <fieldset className="multiselect-panel" id={panelId}>
          <legend className="visually-hidden">{label}</legend>
          {options.length === 0 && <p className="multiselect-empty">{t('filters.noOptions')}</p>}
          {options.map((option) => (
            <label key={option} className="multiselect-option" dir="auto">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}

export default MultiSelectDropdown;
