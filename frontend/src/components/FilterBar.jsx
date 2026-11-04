import MultiSelectDropdown from './MultiSelectDropdown';
import { useLanguage } from '../i18n/useLanguage';
import './FilterBar.css';

function FilterBar({ filterOptions, selectedFilters, onChange }) {
  const { t } = useLanguage();
  const hasActiveFilters =
    selectedFilters.specialties.length > 0 ||
    selectedFilters.locations.length > 0 ||
    selectedFilters.insurances.length > 0;

  const clearAll = () => {
    onChange({ specialties: [], locations: [], insurances: [] });
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
      {hasActiveFilters && (
        <button type="button" className="filter-clear-btn" onClick={clearAll}>
          {t('filters.clear')}
        </button>
      )}
    </div>
  );
}

export default FilterBar;