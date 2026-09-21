import { NavLink } from 'react-router-dom';
import './Sidebar.css';


const links = [
  { to: '/', label: 'Welcome', end: true },
  { to: '/chat', label: 'Chat with Assistant' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/appointments', label: 'My Appointments' },
  { to: '/about', label: 'About' },
  { to: '/admin/login', label: 'Admin' },
];

function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">Medical Chatbot</div>
      <ul className="sidebar-links">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Sidebar;