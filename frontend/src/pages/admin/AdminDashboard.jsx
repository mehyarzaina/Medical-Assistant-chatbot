import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminStats } from '../../api';
import { clearAdminToken } from '../../utils/adminAuth';
import '../../styles/admin.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, [dateFrom, dateTo]);

  function load() {
    const filters = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;

    getAdminStats(filters)
      .then((res) => { setStats(res); setError(''); })
      .catch(() => setError('Could not load stats — your session may have expired.'));
  }

  function handleLogout() {
    clearAdminToken();
    navigate('/admin/login');
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="admin-btn admin-btn-secondary" onClick={handleLogout}>Log out</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-filters">
        <label>
          From date
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          To date
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        {(dateFrom || dateTo) && (
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total_doctors}</span>
            <span className="stat-label">Doctors</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.total_appointments}</span>
            <span className="stat-label">Appointments{dateFrom || dateTo ? ' (filtered)' : ''}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.confirmed_upcoming}</span>
            <span className="stat-label">Confirmed</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.cancelled}</span>
            <span className="stat-label">Cancelled</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.total_patients}</span>
            <span className="stat-label">Patients</span>
          </div>
        </div>
      )}

      <nav className="admin-nav">
        <Link to="/admin/doctors">Manage Doctors</Link>
        <Link to="/admin/appointments">Manage Appointments</Link>
        <Link to="/admin/patients">View Patients</Link>
        <Link to="/admin/insurance">Manage Insurance</Link>
      </nav>
    </div>
  );
}

export default AdminDashboard;