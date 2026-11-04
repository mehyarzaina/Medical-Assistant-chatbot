import { useId } from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { useLanguage } from '../i18n/useLanguage';
import './FilterBar.css';

// Days ahead to look for a free slot; 1 means today.
const AVAILABILITY_OPTIONS = [1, 3, 7, 14];

function FilterBar({ filterOptions, selectedFilters, onChange }) {
  const { t } = useLanguage();
  const hasActiveFilters =
    selectedFilters.specialties.length > 0 ||
    selectedFilters.locations.length > 0 ||
    selectedFilters.insurances.length > 0 ||
    !!selectedFilters.availableWithin;
  const availabilityId = useId();

  const clearAll = () => {
    onChange({ specialties: [], locations: [], insurances: [], availableWithin: null });
  };

  return (
    <div className="filter-bar" role="group" aria-label={t('filters.label')}>
      <MultiSelectDropdown
        label={t('filters.specialty')}
        options={filterOptions.specialties}
        selected={selectedFilters.specialties}
        onChange={(specialties) => onChange({ ...selectedFilters, specialties })}
      />
      <MultiSelectDropdown
        label={t('filters.location')}
        options={filterOptions.locations}
        selected={selectedFilters.locations}
        onChange={(locations) => onChange({ ...selectedFilters, locations })}
      />
      <MultiSelectDropdown
        label={t('filters.insurance')}
        options={filterOptions.insurances}
        selected={selectedFilters.insurances}
        onChange={(insurances) => onChange({ ...selectedFilters, insurances })}
      />
      <div className="filter-select-wrap">
        <label htmlFor={availabilityId} className="visually-hidden">{t('filters.availability')}</label>
        <select
          id={availabilityId}
          className={`filter-select ${selectedFilters.availableWithin ? 'is-active' : ''}`}
          value={selectedFilters.availableWithin ?? ''}
          onChange={(e) => onChange({ ...selectedFilters, availableWithin: Number(e.target.value) || null })}
        >
          <option value="">{t('filters.anyAvailability')}</option>
          {AVAILABILITY_OPTIONS.map((days) => (
            <option key={days} value={days}>{t(`filters.openWithin.${days}`)}</option>
          ))}
        </select>
      </div>
      {hasActiveFilters && (
        <button type="button" className="filter-clear-btn" onClick={clearAll}>
          {t('filters.clear')}
        </button>
      )}
    </div>
  );
}

export default FilterBar;