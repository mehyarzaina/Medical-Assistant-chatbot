import { NavLink, useNavigate } from 'react-router-dom';
import { clearAdminToken } from '../../utils/adminAuth';
import '../../styles/admin.css';

const TABS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/appointments', label: 'Appointments' },
  { to: '/admin/doctors', label: 'Doctors' },
  { to: '/admin/patients', label: 'Patients' },
  { to: '/admin/insurance', label: 'Insurance' },
];

// Shared frame for the signed-in admin pages. The admin area is English-only,
// so it stays left-to-right even when the public site is switched to Arabic.
function AdminLayout({ title, lede, actions, children }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAdminToken();
    navigate('/admin/login');
  }

  return (
    <div className="page admin-page" dir="ltr" lang="en">
      <div className="admin-topbar">
        <nav className="admin-tabs" aria-label="Admin sections">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className="admin-tab">
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
      </div>

      <header className="page-head admin-head">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">{title}</h1>
          {lede && <p className="page-lede">{lede}</p>}
        </div>
        {actions && <div className="admin-head-actions">{actions}</div>}
      </header>

      {children}
    </div>
  );
}

export default AdminLayout;
