import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import FilterBar from '../components/FilterBar';
import DoctorCard from '../components/DoctorCard';
import { getDoctors, getInsuranceCompanies } from '../api';
import { useLanguage } from '../i18n/useLanguage';
import usePageTitle from '../hooks/usePageTitle';
import './Doctors.css';

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function cityFromLocation(location = '') {
  return location.split(/[,،]/)[0].trim();
}

function Doctors() {
  const { t } = useLanguage();
  usePageTitle('doctors');
  const [allDoctors, setAllDoctors] = useState([]);
  // Filtered results are stored with the filters they answer, so the effect
  // below never has to reset state before fetching.
  const [filtered, setFiltered] = useState({ key: null, doctors: [] });
  const [insuranceOptions, setInsuranceOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    specialties: [], locations: [], insurances: [], availableWithin: null,
  });
  const [nameSearch, setNameSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDoctors(), getInsuranceCompanies()])
      .then(([doctorsData, insuranceData]) => {
        setAllDoctors(doctorsData);
        setInsuranceOptions(insuranceData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const { specialties, locations, insurances, availableWithin } = selectedFilters;
  const noFilters =
    specialties.length === 0 && locations.length === 0 && insurances.length === 0 && !availableWithin;
  const filterKey = JSON.stringify(selectedFilters);

  useEffect(() => {
    if (noFilters) return;
    let cancelled = false;
    getDoctors(JSON.parse(filterKey))
      .then((result) => { if (!cancelled) setFiltered({ key: filterKey, doctors: result }); })
      .catch((err) => { if (!cancelled) { setError(err.message); setFiltered({ key: filterKey, doctors: [] }); } });
    return () => { cancelled = true; };
  }, [filterKey, noFilters]);

  const doctors = noFilters ? allDoctors : filtered.key === filterKey ? filtered.doctors : [];
  const busy = loading || (!noFilters && filtered.key !== filterKey);

  const filterOptions = {
    specialties: uniqueSorted(allDoctors.map((d) => d.specialty)),
    locations: uniqueSorted(allDoctors.map((d) => cityFromLocation(d.location))),
    insurances: insuranceOptions,
  };

  const visibleDoctors = nameSearch.trim()
    ? doctors.filter((d) => d.name.toLowerCase().includes(nameSearch.trim().toLowerCase()))
    : doctors;

  return (
    <div className="page doctors-page">
      <BackButton />
      <header className="page-head">
        <p className="page-eyebrow">{t('doctors.eyebrow')}</p>
        <h1 className="page-title">{t('doctors.title')}</h1>
      </header>

      <label className="doctors-search-label" htmlFor="doctor-search">{t('doctors.searchLabel')}</label>
      <input
        id="doctor-search"
        type="search"
        className="doctors-search"
        placeholder={t('doctors.searchPlaceholder')}
        value={nameSearch}
        onChange={(e) => setNameSearch(e.target.value)}
      />

      <FilterBar
        filterOptions={filterOptions}
        selectedFilters={selectedFilters}
        onChange={setSelectedFilters}
      />

      <div aria-live="polite">
        {busy && <p className="doctors-status">{t('doctors.loading')}</p>}
        {error && <p className="doctors-status doctors-error" role="alert">{t('doctors.loadError', { error })}</p>}
        {!busy && !error && visibleDoctors.length === 0 && (
          <p className="doctors-status">{t('doctors.empty')}</p>
        )}
        {!busy && !error && visibleDoctors.length > 0 && (
          <p className="doctors-status">
            {t('doctors.count', { count: visibleDoctors.length })} · {t('doctors.dataNote')}
          </p>
        )}
      </div>

      <div className="doctors-grid">
        {visibleDoctors.map((doctor) => (
          <DoctorCard key={doctor.doctor_id} doctor={doctor} />
        ))}
      </div>

    </div>
  );
}

export default Doctors;