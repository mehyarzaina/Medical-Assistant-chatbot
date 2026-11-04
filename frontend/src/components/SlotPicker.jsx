import { useLanguage } from '../i18n/useLanguage';
import './BookingModal.css';

// Time-slot buttons shared by booking and rescheduling.
function SlotPicker({ slots, selectedTime, onSelect, loading, error, labelId }) {
  const { t } = useLanguage();
  return (
    <>
      <p className="booking-label" id={labelId}>{t('booking.times')}</p>
      <div aria-live="polite">
        {loading && <p className="booking-status">{t('booking.loadingSlots')}</p>}
        {error && <p className="booking-status booking-error">{t('booking.slotsError', { error })}</p>}
        {!loading && !error && slots.length === 0 && (
          <p className="booking-status">{t('booking.noSlots')}</p>
        )}
      </div>
      <div className="booking-slot-grid" role="group" aria-labelledby={labelId}>
        {slots.map((time) => (
          <button
            type="button"
            key={time}
            className={`booking-slot ${selectedTime === time ? 'selected' : ''}`}
            aria-pressed={selectedTime === time}
            onClick={() => onSelect(time)}
            dir="ltr"
          >
            {time}
          </button>
        ))}
      </div>
    </>
  );
}

export default SlotPicker;
