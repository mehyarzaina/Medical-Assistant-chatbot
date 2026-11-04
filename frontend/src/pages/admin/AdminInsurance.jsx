import { useEffect, useState } from 'react';
import { adminListInsuranceCompanies, adminCreateInsuranceCompany } from '../../api';
import AdminLayout from '../../components/admin/AdminLayout';
import usePageTitle from '../../hooks/usePageTitle';

function AdminInsurance() {
  usePageTitle('admin');
  const [companies, setCompanies] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminListInsuranceCompanies()
      .then(setCompanies)
      .catch((err) => { setError(err.message); setCompanies([]); });
  }, [reloadKey]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setSaving(true);
    try {
      await adminCreateInsuranceCompany(newName.trim());
      setNewName('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title="Insurance companies" lede="Companies patients can filter doctors by.">
      <form className="admin-filters" onSubmit={handleAdd}>
        <div className="field">
          <label className="field-label" htmlFor="insurance-name">Add a company</label>
          <input
            id="insurance-name"
            className="input"
            type="text"
            dir="auto"
            placeholder="Company name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={saving || !newName.trim()}>
          {saving ? 'Adding…' : 'Add company'}
        </button>
      </form>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {companies && <p className="admin-table-count">{companies.length} companies</p>}

      <div className="admin-table-wrapper">
        {companies === null ? (
          <div className="admin-empty">Loading…</div>
        ) : companies.length === 0 ? (
          <div className="admin-empty">No insurance companies yet.</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th scope="col">Name</th></tr></thead>
            <tbody>
              {companies.map((name) => (
                <tr key={name}><td dir="auto">{name}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminInsurance;
