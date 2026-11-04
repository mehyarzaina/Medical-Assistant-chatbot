import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDoctors, adminCreateDoctor, adminUpdateDoctor, adminDeleteDoctor, getAdminSpecialties } from '../../api';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/Modal';
import usePageTitle from '../../hooks/usePageTitle';

const emptyForm = { doctor_id: '', name: '', specialty: '', location: '', phone: '', about: '' };
const PAGE_SIZE = 100;

const FIELDS = [
  { key: 'doctor_id', label: 'Doctor ID' },
  { key: 'name', label: 'Name' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location', wide: true },
  { key: 'about', label: 'About', wide: true, multiline: true },
];

function AdminDoctors() {
  usePageTitle('admin');
  const titleId = useId();
  const [result, setResult] = useState({ key: null, doctors: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const key = `${specialtyFilter}|${reloadKey}`;

  useEffect(() => {
    getAdminSpecialties().then(setSpecialties).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDoctors(specialtyFilter ? { specialties: [specialtyFilter] } : {})
      .then((doctors) => { if (!cancelled) setResult({ key, doctors }); })
      .catch((err) => { if (!cancelled) setResult({ key, doctors: [], error: err.message }); });
    return () => { cancelled = true; };
  }, [key, specialtyFilter]);

  const loading = result.key !== key;
  const q = search.trim().toLowerCase();
  const filtered = q ? result.doctors.filter((d) => d.name.toLowerCase().includes(q)) : result.doctors;

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
        const updates = { ...form };
        delete updates.doctor_id;
        await adminUpdateDoctor(editingId, updates);
      } else {
        if (!form.doctor_id.trim()) {
          setError('Doctor ID is required.');
          return;
        }
        await adminCreateDoctor(form);
      }
      setModalOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(doctor) {
    if (!window.confirm(`Delete ${doctor.name} (${doctor.doctor_id})? This cannot be undone.`)) return;
    try {
      await adminDeleteDoctor(doctor.doctor_id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <AdminLayout
      title="Doctors"
      lede="The directory patients search and the assistant recommends from."
      actions={<button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add doctor</button>}
    >
      <div className="admin-filters">
        <div className="field">
          <label className="field-label" htmlFor="doctor-search">Search by name</label>
          <input
            id="doctor-search"
            className="input"
            type="search"
            dir="auto"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE); }}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="doctor-specialty">Specialty</label>
          <select
            id="doctor-specialty"
            className="input"
            value={specialtyFilter}
            onChange={(e) => { setSpecialtyFilter(e.target.value); setShown(PAGE_SIZE); }}
          >
            <option value="">All</option>
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {result.error && <div className="admin-error" role="alert">{result.error}</div>}
      {!loading && (
        <p className="admin-table-count" aria-live="polite">
          {filtered.length > shown ? `Showing ${shown} of ${filtered.length} doctors` : `${filtered.length} doctors`}
        </p>
      )}

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">No doctors match these filters.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Specialty</th>
                <th scope="col">Location</th>
                <th scope="col">Phone</th>
                <th scope="col"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, shown).map((d) => (
                <tr key={d.doctor_id}>
                  <td dir="auto"><strong>{d.name}</strong></td>
                  <td dir="auto">{d.specialty}</td>
                  <td dir="auto">{d.location}</td>
                  <td dir="ltr">{d.phone}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link className="btn btn-ghost btn-sm" to={`/doctors/${d.doctor_id}`}>View</Link>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>Edit</button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm admin-delete"
                        onClick={() => handleDelete(d)}
                        aria-label={`Delete ${d.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > shown && (
        <div className="actions-row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown((n) => n + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, filtered.length - shown)} more
          </button>
        </div>
      )}

      {modalOpen && (
        <Modal
          labelledBy={titleId}
          onClose={() => setModalOpen(false)}
          overlayClassName="admin-modal-backdrop"
          panelClassName="admin-modal"
        >
          <h2 id={titleId}>{editingId ? 'Edit doctor' : 'Add doctor'}</h2>
          {error && <div className="admin-error" role="alert">{error}</div>}
          <form onSubmit={handleSave}>
            <div className="admin-form-grid">
              {FIELDS.map((field) => {
                const id = `doctor-form-${field.key}`;
                const props = {
                  id,
                  className: 'input',
                  dir: 'auto',
                  value: form[field.key] ?? '',
                  disabled: field.key === 'doctor_id' && !!editingId,
                  onChange: (e) => setForm({ ...form, [field.key]: e.target.value }),
                };
                return (
                  <div key={field.key} className={`field ${field.wide ? 'field-wide' : ''}`}>
                    <label className="field-label" htmlFor={id}>{field.label}</label>
                    {field.multiline ? <textarea rows={5} {...props} /> : <input {...props} />}
                  </div>
                );
              })}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">{editingId ? 'Save changes' : 'Add doctor'}</button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}

export default AdminDoctors;
