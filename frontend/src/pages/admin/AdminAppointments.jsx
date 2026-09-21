import { useEffect, useState } from 'react';
import { adminListAppointments } from '../../api';
import '../../styles/admin.css';

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [statusFilter, doctorFilter]);

  function load() {
    setLoading(true);
    const filters = {};
    if (statusFilter) filters.status = statusFilter;
    if (doctorFilter) filters.doctor_id = doctorFilter;
    adminListAppointments(filters).then((res) => {
      setAppointments(res);
      setLoading(false);
    });
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Appointments</h2>
      </div>

      <div className="admin-filters">
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>
          Doctor ID
          <input
            type="text"
            placeholder="Filter by doctor_id"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          />
        </label>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="admin-empty">No appointments match these filters.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.appointment_id}>
                  <td>{a.patient_name}</td>
                  <td>{a.doctor_id}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td><span className={`admin-status ${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminAppointments;