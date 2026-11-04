import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api';
import BackButton from '../../components/BackButton';
import { setAdminToken } from '../../utils/adminAuth';
import usePageTitle from '../../hooks/usePageTitle';
import '../../styles/admin.css';

function AdminLogin() {
  usePageTitle('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(password);
      setAdminToken(res.session_token);
      navigate('/admin/dashboard');
    } catch {
      setError('Incorrect password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page page-narrow" dir="ltr" lang="en">
      <BackButton />
      <header className="page-head">
        <p className="page-eyebrow">Admin</p>
        <h1 className="page-title">Log in</h1>
        <p className="page-lede">Enter the admin password to see the dashboard, bookings and the doctor directory.</p>
      </header>

      <form className="panel admin-login" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
