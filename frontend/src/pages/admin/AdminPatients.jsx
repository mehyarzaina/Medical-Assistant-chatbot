import { useEffect, useState } from 'react';
import { adminListPatients } from '../../api';
import AdminLayout from '../../components/admin/AdminLayout';
import usePageTitle from '../../hooks/usePageTitle';

function AdminPatients() {
  usePageTitle('admin');
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminListPatients()
      .then(setPatients)
      .catch((err) => { setError(err.message); setPatients([]); });
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = (patients ?? []).filter((p) =>
    [p.name, p.email, p.phone].some((v) => v?.toLowerCase().includes(q)));

  return (
    <AdminLayout title="Patients" lede="People who have booked at least once. Saved from the booking form.">
      <div className="admin-filters">
        <div className="field">
          <label className="field-label" htmlFor="patient-search">Search</label>
          <input
            id="patient-search"
            className="input"
            type="search"
            placeholder="Name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {patients && <p className="admin-table-count" aria-live="polite">{filtered.length} patients</p>}

      <div className="admin-table-wrapper">
        {patients === null ? (
          <div className="admin-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">No patients match this search.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.email}>
                  <td dir="auto"><strong>{p.name}</strong></td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminPatients;
