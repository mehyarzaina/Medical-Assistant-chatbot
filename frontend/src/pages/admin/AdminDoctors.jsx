import { useEffect, useState } from 'react';
import { getDoctors, adminCreateDoctor, adminUpdateDoctor, adminDeleteDoctor, getAdminSpecialties } from '../../api';
import '../../styles/admin.css';

const emptyForm = { doctor_id: '', name: '', specialty: '', location: '', phone: '', about: '', profile_url: '' };

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminSpecialties().then(setSpecialties);
  }, []);

  useEffect(() => {
    load();
  }, [specialtyFilter]);

  function load() {
    setLoading(true);
    getDoctors(specialtyFilter ? { specialties: [specialtyFilter] } : {}).then((res) => {
      setDoctors(res);
      setLoading(false);
    });
  }

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setModalOpen(true);
  }

  function openEdit(doctor) {
    setForm({ ...emptyForm, ...doctor });
    setEditingId(doctor.doctor_id);
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        const { doctor_id, ...updates } = form;
        await adminUpdateDoctor(editingId, updates);
      } else {
        if (!form.doctor_id.trim()) {
          setError('Doctor ID is required.');
          return;
        }
        await adminCreateDoctor(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(doctorId) {
    if (!confirm(`Delete doctor ${doctorId}? This cannot be undone.`)) return;
    try {
      await adminDeleteDoctor(doctorId);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Doctors</h2>
        <button className="admin-btn" onClick={openCreate}>+ Add Doctor</button>
      </div>

      <div className="admin-filters">
        <label>
          Search by name
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label>
          Specialty
          <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
            <option value="">All</option>
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">No doctors match these filters.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>Location</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.doctor_id}>
                  <td>{d.name}</td>
                  <td>{d.specialty}</td>
                  <td>{d.location}</td>
                  <td>{d.phone}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="admin-btn admin-btn-secondary" onClick={() => openEdit(d)}>Edit</button>
                    <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(d.doctor_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? 'Edit Doctor' : 'Add Doctor'}</h3>
            {error && <div className="admin-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="admin-form-row">
                <label>Doctor ID</label>
                <input
                  value={form.doctor_id}
                  disabled={!!editingId}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                />
              </div>
              <div className="admin-form-row">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <label>Specialty</label>
                <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <label>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <label>About</label>
                <textarea rows={4} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <label>Profile URL</label>
                <input value={form.profile_url} onChange={(e) => setForm({ ...form, profile_url: e.target.value })} />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn">{editingId ? 'Save changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDoctors;