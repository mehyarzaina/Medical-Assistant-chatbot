import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accessible dialog shell: moves focus in on open, keeps Tab inside, closes on
// Escape or a backdrop click, and returns focus to whatever opened it.
// Key handling stops propagation so a dialog nested in another only closes itself.
function Modal({ labelledBy, onClose, overlayClassName, panelClassName, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const first = panelRef.current?.querySelector(FOCUSABLE);
    (first || panelRef.current)?.focus();
    return () => opener?.focus?.();
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    e.stopPropagation();
    const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={overlayClassName} onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        ref={panelRef}
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
