import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import FilterBar from '../components/FilterBar';
import DoctorCard from '../components/DoctorCard';
import DoctorDetail from '../components/DoctorDetail';
import { getDoctors, getInsuranceCompanies } from '../api';
import './Doctors.css';

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function cityFromLocation(location = '') {
  return location.split(/[,،]/)[0].trim();
}

function Doctors() {
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [insuranceOptions, setInsuranceOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    specialties: [], locations: [], insurances: [],
  });
  const [nameSearch, setNameSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDoctors(), getInsuranceCompanies()])
      .then(([doctorsData, insuranceData]) => {
        setAllDoctors(doctorsData);
        setDoctors(doctorsData);
        setInsuranceOptions(insuranceData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const { specialties, locations, insurances } = selectedFilters;
    if (specialties.length === 0 && locations.length === 0 && insurances.length === 0) {
      setDoctors(allDoctors);
      return;
    }
    setLoading(true);
    getDoctors({ specialties, locations, insurances })
      .then(setDoctors)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedFilters, allDoctors]);

  const filterOptions = {
    specialties: uniqueSorted(allDoctors.map((d) => d.specialty)),
    locations: uniqueSorted(allDoctors.map((d) => cityFromLocation(d.location))),
    insurances: insuranceOptions,
  };

  const visibleDoctors = nameSearch.trim()
    ? doctors.filter((d) => d.name.toLowerCase().includes(nameSearch.trim().toLowerCase()))
    : doctors;

  return (
    <div className="doctors-page">
      <BackButton />
      <h1>Doctors</h1>

      <input
        type="text"
        className="doctors-search"
        placeholder="Search by doctor name…"
        value={nameSearch}
        onChange={(e) => setNameSearch(e.target.value)}
      />

      <FilterBar
        filterOptions={filterOptions}
        selectedFilters={selectedFilters}
        onChange={setSelectedFilters}
      />

      {loading && <p className="doctors-status">Loading doctors…</p>}
      {error && <p className="doctors-status doctors-error">Couldn't load doctors: {error}</p>}
      {!loading && !error && visibleDoctors.length === 0 && (
        <p className="doctors-status">No doctors match those filters.</p>
      )}

      <div className="doctors-grid">
        {visibleDoctors.map((doctor) => (
          <DoctorCard key={doctor.doctor_id} doctor={doctor} onSelect={setSelectedDoctorId} />
        ))}
      </div>

      {selectedDoctorId && (
        <DoctorDetail doctorId={selectedDoctorId} onClose={() => setSelectedDoctorId(null)} />
      )}
    </div>
  );
}

export default Doctors;