import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Eye, Ticket, MessageSquare, Mail, Send } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    account_number: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    customer_type: 'retail'
  });

  // Personalized coupon modal state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForCustomer, setCouponForCustomer] = useState(null);
  const [createdCoupon, setCreatedCoupon] = useState(null);
  const [emailingCoupon, setEmailingCoupon] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 0,
    usage_limit: 1,
  });
  const [couponMsg, setCouponMsg] = useState({ type: '', text: '' });
  const [couponSaving, setCouponSaving] = useState(false);

  // Normalize local-format phone numbers (e.g., "(876) 843-2416") to E.164.
  // Defaults to Jamaica (+1876) if the number has exactly 7 digits (local),
  // otherwise uses the digits as-is with a leading '+'.
  const normalizeToE164 = (raw) => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (raw.trim().startsWith('+')) return '+' + digits;
    if (digits.length === 10 && digits.startsWith('876')) return '+1' + digits;
    if (digits.length === 7) return '+1876' + digits;
    if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
    if (digits.length === 10) return '+1' + digits;
    return '+' + digits;
  };

  const buildShareMessage = (customer, coupon) => {
    const disc = coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% OFF`
      : `$${coupon.discount_value.toFixed(2)} OFF`;
    const minP = coupon.min_purchase > 0 ? ` (min purchase $${coupon.min_purchase.toFixed(2)})` : '';
    return `Hi ${customer.name}! Here's your personalized coupon: ${coupon.code} — ${disc}${minP}. Show this at checkout. Thank you!`;
  };

  const openCouponModal = (customer, preset) => {
    setCouponForCustomer(customer);
    setCreatedCoupon(null);
    const suggestedCode = preset === 'winback'
      ? `MISS${(customer.name || 'VIP').split(' ')[0].toUpperCase().slice(0, 4)}${Math.floor(Math.random() * 900 + 100)}`
      : `${(customer.name || 'VIP').split(' ')[0].toUpperCase().slice(0, 6)}${Math.floor(Math.random() * 900 + 100)}`;
    setCouponForm({
      code: suggestedCode,
      description: preset === 'winback'
        ? `We miss you, ${customer.name} — here's a little something to welcome you back`
        : `Personalized for ${customer.name}`,
      discount_type: 'percentage',
      discount_value: preset === 'winback' ? 15 : 10,
      min_purchase: 0,
      usage_limit: 1,
    });
    setCouponMsg({ type: '', text: '' });
    setShowCouponModal(true);
  };

  const submitCustomerCoupon = async () => {
    if (!couponForm.code.trim()) {
      setCouponMsg({ type: 'error', text: 'Coupon code is required' });
      return;
    }
    if (!couponForm.discount_value || couponForm.discount_value <= 0) {
      setCouponMsg({ type: 'error', text: 'Discount value must be greater than 0' });
      return;
    }
    setCouponSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/coupons`, {
        code: couponForm.code.toUpperCase().trim(),
        description: couponForm.description,
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value),
        min_purchase: parseFloat(couponForm.min_purchase) || 0,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        is_active: true,
        customer_id: couponForCustomer.id,
        customer_name: couponForCustomer.name,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCreatedCoupon(response.data);
      setCouponMsg({ type: 'success', text: `Coupon ${response.data.code} created. Share it below.` });
    } catch (error) {
      setCouponMsg({ type: 'error', text: error.response?.data?.detail || 'Failed to create coupon' });
    } finally {
      setCouponSaving(false);
    }
  };

  const shareViaSMS = () => {
    if (!couponForCustomer || !createdCoupon) return;
    const phone = normalizeToE164(couponForCustomer.phone);
    if (!phone) {
      setCouponMsg({ type: 'error', text: 'Customer has no phone number on file' });
      return;
    }
    const body = encodeURIComponent(buildShareMessage(couponForCustomer, createdCoupon));
    // sms: URI with ?body= works on iOS, Android, and most desktops (falls back gracefully)
    window.open(`sms:${phone}?&body=${body}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    if (!couponForCustomer || !createdCoupon) return;
    const phone = normalizeToE164(couponForCustomer.phone).replace(/\D/g, '');
    if (!phone) {
      setCouponMsg({ type: 'error', text: 'Customer has no phone number on file' });
      return;
    }
    const text = encodeURIComponent(buildShareMessage(couponForCustomer, createdCoupon));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const emailCouponToCustomer = async () => {
    if (!createdCoupon) return;
    if (!couponForCustomer?.email) {
      setCouponMsg({ type: 'error', text: 'Customer has no email on file' });
      return;
    }
    setEmailingCoupon(true);
    try {
      const token = localStorage.getItem('token');
      const r = await axios.post(
        `${API}/coupons/${createdCoupon.id}/email-to-customer`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCouponMsg({ type: 'success', text: `Emailed coupon to ${r.data.recipient}` });
    } catch (error) {
      setCouponMsg({ type: 'error', text: error.response?.data?.detail || 'Failed to send email' });
    } finally {
      setEmailingCoupon(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Auto-open coupon modal when navigated from Dashboard with ?coupon_for=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('coupon_for');
    const preset = params.get('preset');
    if (!targetId || customers.length === 0) return;
    const cust = customers.find(c => c.id === targetId);
    if (cust) {
      openCouponModal(cust, preset);
      window.history.replaceState({}, '', '/customers');
    }
     
  }, [customers]);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.account_number && customer.account_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingCustomer) {
        // When editing, don't send account_number (it's locked)
        const { account_number, ...updateData } = formData;
        await axios.put(`${API}/customers/${editingCustomer.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Customer updated successfully!');
      } else {
        await axios.post(`${API}/customers`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Customer added successfully!');
      }
      fetchCustomers();
      closeModal();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(`Error: ${error.response?.data?.detail || 'Failed to save customer'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Customer deleted successfully!');
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert(`Error: ${error.response?.data?.detail || 'Failed to delete customer'}`);
    }
  };

  const viewCustomerDetails = async (customerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCustomer(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        account_number: customer.account_number || '',
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        address: customer.address || '',
        customer_type: customer.customer_type || 'retail'
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        account_number: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'retail'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCustomer(null);
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <div data-testid="customers-page">
      <div className="page-header">
        <h1>Customers</h1>
        <p>Manage customer information and history</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by name, account #, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="customers-search"
            />
          </div>
          <button 
            className="btn btn-success" 
            onClick={() => openModal()}
            data-testid="add-customer-btn"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>

        <div className="table-container">
          {filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No customers found</h3>
              <p>Start by adding your first customer</p>
            </div>
          ) : (
            <table data-testid="customers-table">
              <thead>
                <tr>
                  <th>Account #</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Points</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} data-testid={`customer-${customer.id}`}>
                    <td>
                      <code style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '600', 
                        color: '#667eea',
                        background: '#f0f4ff',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        {customer.account_number || 'N/A'}
                      </code>
                    </td>
                    <td>{customer.name}</td>
                    <td>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: customer.customer_type === 'wholesale' ? '#dbeafe' : '#f0fdf4',
                        color: customer.customer_type === 'wholesale' ? '#1d4ed8' : '#166534'
                      }}>
                        {(customer.customer_type || 'retail').toUpperCase()}
                      </span>
                    </td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || '-'}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#f59e0b',
                        background: '#fef3c7',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        ⭐ {(customer.points_balance || 0).toFixed(0)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500', color: '#059669' }}>
                        ${(customer.total_spent || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon"
                          onClick={() => viewCustomerDetails(customer.id)}
                          data-testid={`view-customer-${customer.id}`}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => openModal(customer)}
                          data-testid={`edit-customer-${customer.id}`}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(customer.id)}
                          data-testid={`delete-customer-${customer.id}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="customer-modal">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="btn-close" onClick={closeModal} data-testid="close-modal-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Account Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value.toUpperCase() })}
                    placeholder="Leave blank to use phone number"
                    data-testid="customer-account-input"
                    disabled={editingCustomer}
                    style={{ background: editingCustomer ? '#f1f5f9' : 'white' }}
                  />
                  {!editingCustomer ? (
                    <small style={{ color: '#667eea', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                      💡 If left blank, last 4 digits of phone number will be used
                    </small>
                  ) : (
                    <small style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                      Account number cannot be changed after creation
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="customer-name-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      data-testid="customer-phone-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      data-testid="customer-email-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="customer-address-input"
                  />
                </div>
                <div className="form-group">
                  <label>Customer Type</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                    data-testid="customer-type-select"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  >
                    <option value="retail">Retail (Standard Pricing)</option>
                    <option value="wholesale">Wholesale (Bulk Pricing)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" data-testid="save-customer-btn">
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="customer-detail-modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Customer Profile</h2>
              <button className="btn-close" onClick={closeDetailModal} data-testid="close-detail-modal-btn">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f4ff', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedCustomer.name}</h3>
                  <code style={{ 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    color: '#667eea',
                    background: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px'
                  }}>
                    {selectedCustomer.account_number || 'N/A'}
                  </code>
                </div>
                <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                <p><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</p>
                <p><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</p>
                <p><strong>Customer Since:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    data-testid="generate-customer-coupon-btn"
                    onClick={() => openCouponModal(selectedCustomer)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#7c3aed',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <Ticket size={14} />
                    Generate Personalized Coupon
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🛍️ Purchase History
                  {selectedCustomer.purchase_history && selectedCustomer.purchase_history.length > 0 && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      ({selectedCustomer.purchase_history.length} transactions)
                    </span>
                  )}
                </h3>
                {selectedCustomer.purchase_history && selectedCustomer.purchase_history.length > 0 ? (
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {selectedCustomer.purchase_history.map((sale) => (
                      <div 
                        key={sale.id} 
                        style={{
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <code style={{ fontSize: '0.75rem', color: '#667eea' }}>
                              {sale.id.substring(0, 8).toUpperCase()}
                            </code>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0' }}>
                              {sale.items.length} item(s)
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                              ${sale.total.toFixed(2)}
                            </p>
                            <span className={`badge ${sale.payment_method}`} style={{ fontSize: '0.75rem' }}>
                              {sale.payment_method}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          {new Date(sale.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                    No purchase history yet
                  </p>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔧 Repair History
                  {selectedCustomer.repair_history && selectedCustomer.repair_history.length > 0 && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      ({selectedCustomer.repair_history.length} repairs)
                    </span>
                  )}
                </h3>
                {selectedCustomer.repair_history && selectedCustomer.repair_history.length > 0 ? (
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {selectedCustomer.repair_history.map((repair) => (
                      <div 
                        key={repair.id} 
                        style={{
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong>{repair.device}</strong>
                          <span className={`badge ${repair.status}`}>{repair.status}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                          {repair.issue_description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
                          <span>{new Date(repair.created_at).toLocaleDateString()}</span>
                          <span>${repair.cost.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                    No repair history
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDetailModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Coupon Modal */}
      {showCouponModal && couponForCustomer && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            data-testid="customer-coupon-modal"
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={20} color="#7c3aed" />
                Coupon for {couponForCustomer.name}
              </h2>
              <button
                className="btn-close"
                onClick={() => setShowCouponModal(false)}
                data-testid="close-customer-coupon-btn"
              >×</button>
            </div>
            <div className="modal-body">
              {couponMsg.text && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  backgroundColor: couponMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: couponMsg.type === 'success' ? '#065f46' : '#991b1b'
                }}>{couponMsg.text}</div>
              )}
              <div className="form-group">
                <label>Coupon Code</label>
                <input
                  type="text"
                  data-testid="customer-coupon-code-input"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="VIP123"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Discount Type</label>
                  <select
                    data-testid="customer-coupon-type-select"
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{couponForm.discount_type === 'percentage' ? 'Discount (%)' : 'Discount ($)'}</label>
                  <input
                    type="number"
                    data-testid="customer-coupon-value-input"
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Min Purchase ($)</label>
                  <input
                    type="number"
                    value={couponForm.min_purchase}
                    onChange={(e) => setCouponForm({ ...couponForm, min_purchase: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCouponModal(false)}
                >{createdCoupon ? 'Done' : 'Cancel'}</button>
                {!createdCoupon && (
                  <button
                    type="button"
                    data-testid="submit-customer-coupon-btn"
                    onClick={submitCustomerCoupon}
                    disabled={couponSaving}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#7c3aed',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: couponSaving ? 'not-allowed' : 'pointer',
                      opacity: couponSaving ? 0.7 : 1,
                    }}
                  >
                    {couponSaving ? 'Creating...' : 'Create Coupon'}
                  </button>
                )}
              </div>

              {createdCoupon && (
                <div
                  data-testid="share-coupon-panel"
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#faf5ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '10px',
                  }}
                >
                  <p style={{ fontSize: '13px', color: '#6b21a8', margin: '0 0 12px 0', fontWeight: '600' }}>
                    Share this coupon with {couponForCustomer?.name}:
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      data-testid="share-sms-btn"
                      onClick={shareViaSMS}
                      disabled={!couponForCustomer?.phone}
                      title={couponForCustomer?.phone ? 'Open SMS app' : 'No phone on file'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', backgroundColor: '#3b82f6', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        cursor: couponForCustomer?.phone ? 'pointer' : 'not-allowed',
                        opacity: couponForCustomer?.phone ? 1 : 0.5,
                      }}
                    >
                      <MessageSquare size={14} /> SMS
                    </button>
                    <button
                      type="button"
                      data-testid="share-whatsapp-btn"
                      onClick={shareViaWhatsApp}
                      disabled={!couponForCustomer?.phone}
                      title={couponForCustomer?.phone ? 'Open WhatsApp' : 'No phone on file'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', backgroundColor: '#22c55e', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        cursor: couponForCustomer?.phone ? 'pointer' : 'not-allowed',
                        opacity: couponForCustomer?.phone ? 1 : 0.5,
                      }}
                    >
                      <Send size={14} /> WhatsApp
                    </button>
                    <button
                      type="button"
                      data-testid="share-email-btn"
                      onClick={emailCouponToCustomer}
                      disabled={emailingCoupon || !couponForCustomer?.email}
                      title={couponForCustomer?.email ? `Email to ${couponForCustomer.email}` : 'No email on file'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', backgroundColor: '#8b5cf6', color: '#fff',
                        border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        cursor: (emailingCoupon || !couponForCustomer?.email) ? 'not-allowed' : 'pointer',
                        opacity: (emailingCoupon || !couponForCustomer?.email) ? 0.5 : 1,
                      }}
                    >
                      <Mail size={14} /> {emailingCoupon ? 'Sending...' : 'Email'}
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', marginBottom: 0 }}>
                    SMS and WhatsApp open the chat app with the message pre-filled — you tap Send.
                    {!couponForCustomer?.email && ' · Email is disabled (no email on file).'}
                    {!couponForCustomer?.phone && ' · SMS/WhatsApp are disabled (no phone on file).'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;