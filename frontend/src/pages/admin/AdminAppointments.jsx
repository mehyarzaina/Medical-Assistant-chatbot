import { useEffect, useState } from 'react';
import { adminListAppointments } from '../../api';
import AdminLayout from '../../components/admin/AdminLayout';
import usePageTitle from '../../hooks/usePageTitle';

const formatDate = (iso) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${iso}T12:00:00`));

function AdminAppointments() {
  usePageTitle('admin');
  const [result, setResult] = useState({ key: null, rows: [] });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const key = statusFilter;

  useEffect(() => {
    let cancelled = false;
    adminListAppointments(statusFilter ? { status: statusFilter } : {})
      .then((rows) => { if (!cancelled) setResult({ key: statusFilter, rows }); })
      .catch((err) => { if (!cancelled) setResult({ key: statusFilter, rows: [], error: err.message }); });
    return () => { cancelled = true; };
  }, [statusFilter]);

  const loading = result.key !== key;
  const q = search.trim().toLowerCase();
  const rows = q
    ? result.rows.filter((a) =>
        [a.patient_name, a.patient_email, a.doctor_name, a.doctor_id].some((v) => v?.toLowerCase().includes(q)))
    : result.rows;

  return (
    <AdminLayout title="Appointments" lede="Every booking made through the site, newest first.">
      <div className="admin-filters">
        <div className="field">
          <label className="field-label" htmlFor="appt-search">Search</label>
          <input
            id="appt-search"
            className="input"
            type="search"
            placeholder="Patient, email or doctor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="appt-status">Status</label>
          <select id="appt-status" className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {result.error && <div className="admin-error" role="alert">{result.error}</div>}
      {!loading && <p className="admin-table-count" aria-live="polite">{rows.length} appointments</p>}

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="admin-empty">No appointments match these filters.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Patient</th>
                <th scope="col">Doctor</th>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.appointment_id}>
                  <td>
                    <strong>{a.patient_name}</strong>
                    {a.patient_email && <div className="field-hint">{a.patient_email}</div>}
                  </td>
                  <td dir="auto">{a.doctor_name || a.doctor_id}</td>
                  <td className="nowrap">{formatDate(a.date)}</td>
                  <td className="nowrap" dir="ltr">{a.time}</td>
                  <td><span className={`status-pill is-${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminAppointments;
