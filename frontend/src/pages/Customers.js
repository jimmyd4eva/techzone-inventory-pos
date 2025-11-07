import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';

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
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

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
        address: customer.address || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        account_number: '',
        name: '',
        email: '',
        phone: '',
        address: ''
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
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
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
                    <td>{customer.phone}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.address || '-'}</td>
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
    </div>
  );
};

export default Customers;