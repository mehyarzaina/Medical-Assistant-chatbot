import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api';
import { setAdminToken } from '../../utils/adminAuth';
import '../../styles/admin.css';

function AdminLogin() {
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
    } catch (err) {
      setError('Incorrect password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <button className="admin-back-btn" onClick={() => navigate('/')}>
        ← Back
      </button>

      <h1 className="admin-login-title">Admin Login</h1>

      <div className="admin-login">
        <p className="admin-login-intro">
          Enter the admin password to access the dashboard.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="admin-login-submit" type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Log in'}
          </button>
          {error && <div className="admin-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;