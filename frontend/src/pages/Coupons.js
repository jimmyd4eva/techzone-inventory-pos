import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Plus, Edit2, Trash2, X, Check, Percent, DollarSign, Calendar, Hash } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase: 0,
    max_discount: '',
    usage_limit: '',
    is_active: true,
    valid_from: '',
    valid_until: ''
  });
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase: coupon.min_purchase || 0,
        max_discount: coupon.max_discount || '',
        usage_limit: coupon.usage_limit || '',
        is_active: coupon.is_active,
        valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : ''
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_purchase: 0,
        max_discount: '',
        usage_limit: '',
        is_active: true,
        valid_from: '',
        valid_until: ''
      });
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
      };

      if (editingCoupon) {
        await axios.put(`${API}/coupons/${editingCoupon.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/coupons`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchCoupons();
      closeModal();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save coupon');
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete coupon');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/coupons/${coupon.id}`, { is_active: !coupon.is_active }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (error) {
      alert('Failed to update coupon status');
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="page-container" data-testid="coupons-page">
      <div className="page-header">
        <h1 data-testid="coupons-title">
          <Ticket size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Coupons
        </h1>
        {user?.role === 'admin' && (
          <button 
            className="btn btn-primary" 
            onClick={() => openModal()}
            data-testid="add-coupon-btn"
          >
            <Plus size={20} /> Add Coupon
          </button>
        )}
      </div>

      {coupons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h3>No Coupons Yet</h3>
          <p>Create your first coupon to offer discounts to customers</p>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => openModal()}>
              <Plus size={20} /> Create Coupon
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table data-testid="coupons-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Discount</th>
                  <th>Min Purchase</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Valid Period</th>
                  {user?.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} data-testid={`coupon-row-${coupon.id}`}>
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        fontSize: '14px',
                        backgroundColor: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        letterSpacing: '1px'
                      }}>
                        {coupon.code}
                      </span>
                    </td>
                    <td>{coupon.description || '-'}</td>
                    <td>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#059669',
                        fontWeight: '600'
                      }}>
                        {coupon.discount_type === 'percentage' ? (
                          <><Percent size={14} /> {coupon.discount_value}%</>
                        ) : (
                          <><DollarSign size={14} /> {coupon.discount_value.toFixed(2)}</>
                        )}
                      </span>
                      {coupon.max_discount && coupon.discount_type === 'percentage' && (
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          Max: ${coupon.max_discount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td>${coupon.min_purchase?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={14} color="#6b7280" />
                        {coupon.usage_count || 0}
                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => user?.role === 'admin' && toggleActive(coupon)}
                        data-testid={`toggle-${coupon.id}`}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: user?.role === 'admin' ? 'pointer' : 'default',
                          backgroundColor: coupon.is_active ? '#d1fae5' : '#fee2e2',
                          color: coupon.is_active ? '#065f46' : '#991b1b'
                        }}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>
                      {coupon.valid_from || coupon.valid_until ? (
                        <>
                          {coupon.valid_from && <div>From: {new Date(coupon.valid_from).toLocaleDateString()}</div>}
                          {coupon.valid_until && <div>Until: {new Date(coupon.valid_until).toLocaleDateString()}</div>}
                        </>
                      ) : (
                        'No limit'
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-icon"
                            onClick={() => openModal(coupon)}
                            data-testid={`edit-${coupon.id}`}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDelete(coupon.id)}
                            data-testid={`delete-${coupon.id}`}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button className="btn-icon" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    data-testid="coupon-code-input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    required
                    style={{ fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    data-testid="coupon-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., 20% off all purchases"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Discount Type *</label>
                    <select
                      data-testid="discount-type-select"
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Discount Value *</label>
                    <input
                      type="number"
                      data-testid="discount-value-input"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max={formData.discount_type === 'percentage' ? 100 : undefined}
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Minimum Purchase ($)</label>
                    <input
                      type="number"
                      data-testid="min-purchase-input"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div className="form-group">
                      <label>Max Discount ($)</label>
                      <input
                        type="number"
                        data-testid="max-discount-input"
                        value={formData.max_discount}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="No limit"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    data-testid="usage-limit-input"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Valid From</label>
                    <input
                      type="date"
                      data-testid="valid-from-input"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Valid Until</label>
                    <input
                      type="date"
                      data-testid="valid-until-input"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="is_active"
                    data-testid="is-active-checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="is_active" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Coupon is active
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-testid="save-coupon-btn">
                  <Check size={18} />
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
