import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Truck, Mail, Phone, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EMPTY = {
  name: '', email: '', phone: '', whatsapp_number: '', address: '', notes: '',
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { editing: supplier | null }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const r = await axios.get(`${API}/suppliers`);
      setSuppliers(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm(EMPTY);
    setModal({ editing: null });
    setMsg({ type: '', text: '' });
  };

  const openEdit = (s) => {
    setForm({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      whatsapp_number: s.whatsapp_number || '',
      address: s.address || '',
      notes: s.notes || '',
    });
    setModal({ editing: s });
    setMsg({ type: '', text: '' });
  };

  const save = async () => {
    if (!form.name.trim()) {
      setMsg({ type: 'error', text: 'Supplier name is required' });
      return;
    }
    setSaving(true);
    try {
      if (modal.editing) {
        await axios.put(`${API}/suppliers/${modal.editing.id}`, form);
      } else {
        await axios.post(`${API}/suppliers`, form);
      }
      setMsg({ type: 'success', text: `Supplier ${modal.editing ? 'updated' : 'created'}` });
      setTimeout(() => setModal(null), 900);
      fetchSuppliers();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete supplier "${s.name}"?`)) return;
    try {
      await axios.delete(`${API}/suppliers/${s.id}`);
      fetchSuppliers();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const filtered = suppliers.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q)
      || (s.email || '').toLowerCase().includes(q)
      || (s.phone || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="page-container" data-testid="suppliers-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Truck size={24} />
          Suppliers
        </h1>
        <button
          className="btn btn-success"
          onClick={openCreate}
          data-testid="add-supplier-btn"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div style={{ marginTop: '16px', marginBottom: '16px', position: 'relative', maxWidth: '480px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          type="text"
          data-testid="suppliers-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            {suppliers.length === 0
              ? 'No suppliers yet. Add your first supplier to enable one-click PO emails from the Dashboard.'
              : 'No matches.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Contact', 'Address', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} data-testid={`supplier-row-${s.id}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>
                    {s.email ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={13} color="#8b5cf6" />{s.email}</div> : null}
                    {s.phone ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} color="#3b82f6" />{s.phone}</div> : null}
                    {s.whatsapp_number ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={13} color="#22c55e" />{s.whatsapp_number}</div> : null}
                    {!s.email && !s.phone && !s.whatsapp_number ? <span style={{ color: '#9ca3af' }}>—</span> : null}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{s.address || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => openEdit(s)}
                      data-testid={`edit-supplier-${s.id}`}
                      style={{ marginRight: '6px', padding: '6px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      title="Edit"
                    >
                      <Edit2 size={14} color="#6b7280" />
                    </button>
                    <button
                      onClick={() => remove(s)}
                      data-testid={`delete-supplier-${s.id}`}
                      style={{ padding: '6px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      title="Delete"
                    >
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="supplier-modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>{modal.editing ? 'Edit Supplier' : 'New Supplier'}</h2>
              <button className="btn-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {msg.text && (
                <div style={{
                  padding: '10px 12px', borderRadius: '8px', marginBottom: '12px',
                  backgroundColor: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: msg.type === 'success' ? '#065f46' : '#991b1b',
                }}>{msg.text}</div>
              )}
              <div className="form-group">
                <label>Name *</label>
                <input
                  data-testid="supplier-name-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Kyle china"
                />
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Tip: match the supplier string used in your Inventory items so the Low Stock PO modal auto-fills contacts.
                </p>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  data-testid="supplier-email-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="orders@supplier.com"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    data-testid="supplier-phone-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1..."
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    data-testid="supplier-whatsapp-input"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    placeholder="+1..."
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Lead time, payment terms, etc."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button
                  data-testid="save-supplier-btn"
                  onClick={save}
                  disabled={saving}
                  style={{
                    padding: '10px 18px', background: '#8b5cf6', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : (modal.editing ? 'Save Changes' : 'Create Supplier')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
