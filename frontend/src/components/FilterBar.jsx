import MultiSelectDropdown from './MultiSelectDropdown';
import './FilterBar.css';

function FilterBar({ filterOptions, selectedFilters, onChange }) {
  const hasActiveFilters =
    selectedFilters.specialties.length > 0 ||
    selectedFilters.locations.length > 0 ||
    selectedFilters.insurances.length > 0;

  const clearAll = () => {
    onChange({ specialties: [], locations: [], insurances: [] });
  };

  return (
    <div className="filter-bar">
      <MultiSelectDropdown
        label="Specialty"
        options={filterOptions.specialties}
        selected={selectedFilters.specialties}
        onChange={(specialties) => onChange({ ...selectedFilters, specialties })}
      />
      <MultiSelectDropdown
        label="Location"
        options={filterOptions.locations}
        selected={selectedFilters.locations}
        onChange={(locations) => onChange({ ...selectedFilters, locations })}
      />
      <MultiSelectDropdown
        label="Insurance"
        options={filterOptions.insurances}
        selected={selectedFilters.insurances}
        onChange={(insurances) => onChange({ ...selectedFilters, insurances })}
      />
      {hasActiveFilters && (
        <button type="button" className="filter-clear-btn" onClick={clearAll}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export default FilterBar;