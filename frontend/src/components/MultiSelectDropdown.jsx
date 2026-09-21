import { useState, useRef, useEffect } from 'react';
import './MultiSelectDropdown.css';

function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close the dropdown if the user clicks anywhere outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="multiselect" ref={wrapperRef}>
      <button type="button" className="multiselect-trigger" onClick={() => setOpen(!open)}>
        {label}
        {selected.length > 0 && <span className="multiselect-count">{selected.length}</span>}
        <span className="multiselect-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="multiselect-panel">
          {options.length === 0 && <p className="multiselect-empty">No options yet</p>}
          {options.map((option) => (
            <label key={option} className="multiselect-option">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectDropdown;