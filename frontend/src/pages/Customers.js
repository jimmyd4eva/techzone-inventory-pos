import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Eye, Ticket, MessageSquare, Mail, Send } from 'lucide-react';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal';
import { CustomerCouponModal } from '../components/customers/CustomerCouponModal';

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
    customer_type: 'retail',
    birthday: ''
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
        customer_type: customer.customer_type || 'retail',
        birthday: customer.birthday || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        account_number: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'retail',
        birthday: ''
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
        <CustomerFormModal
          formData={formData}
          setFormData={setFormData}
          editingCustomer={editingCustomer}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}

      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          selectedCustomer={selectedCustomer}
          onClose={() => setShowDetailModal(false)}
          openCouponModal={openCouponModal}
        />
      )}

      {/* Personalized Coupon Modal */}
      {showCouponModal && couponForCustomer && (
        <CustomerCouponModal
          couponForCustomer={couponForCustomer}
          couponForm={couponForm}
          setCouponForm={setCouponForm}
          couponMsg={couponMsg}
          couponSaving={couponSaving}
          createdCoupon={createdCoupon}
          emailingCoupon={emailingCoupon}
          onClose={() => setShowCouponModal(false)}
          submitCustomerCoupon={submitCustomerCoupon}
          shareViaSMS={shareViaSMS}
          shareViaWhatsApp={shareViaWhatsApp}
          emailCouponToCustomer={emailCouponToCustomer}
        />
      )}
    </div>
  );
};

export default Customers;