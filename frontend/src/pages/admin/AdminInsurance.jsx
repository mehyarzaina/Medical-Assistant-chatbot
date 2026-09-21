import { useEffect, useState } from 'react';
import { adminListInsuranceCompanies, adminCreateInsuranceCompany } from '../../api';
import '../../styles/admin.css';

function AdminInsurance() {
  const [companies, setCompanies] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    adminListInsuranceCompanies().then((res) => {
      setCompanies(res);
      setLoading(false);
    });
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await adminCreateInsuranceCompany(newName.trim());
      setNewName('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Insurance Companies</h2>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <form className="admin-filters" onSubmit={handleAdd}>
        <label>
          Add company
          <input
            type="text"
            placeholder="Company name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </label>
        <button className="admin-btn" type="submit">Add</button>
      </form>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : companies.length === 0 ? (
          <div className="admin-empty">No insurance companies yet.</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Name</th></tr></thead>
            <tbody>
              {companies.map((name) => (
                <tr key={name}><td>{name}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminInsurance;