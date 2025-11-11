import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Repairs = () => {
  const [repairs, setRepairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredRepairs, setFilteredRepairs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [formData, setFormData] = useState({
    customer_id: '',
    device: '',
    issue_description: '',
    cost: 0,
    assigned_technician: '',
    notes: ''
  });

  useEffect(() => {
    fetchRepairs();
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = repairs.filter(repair =>
      repair.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRepairs(filtered);
  }, [searchTerm, repairs]);

  const fetchRepairs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/repairs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRepairs(response.data);
      setFilteredRepairs(response.data);
    } catch (error) {
      console.error('Error fetching repairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingRepair) {
        await axios.put(`${API}/repairs/${editingRepair.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/repairs`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchRepairs();
      closeModal();
    } catch (error) {
      console.error('Error saving repair:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this repair job?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/repairs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRepairs();
    } catch (error) {
      console.error('Error deleting repair:', error);
    }
  };

  const openModal = (repair = null) => {
    if (repair) {
      setEditingRepair(repair);
      setFormData({
        customer_id: repair.customer_id,
        device: repair.device,
        issue_description: repair.issue_description,
        cost: repair.cost,
        assigned_technician: repair.assigned_technician || '',
        notes: repair.notes || ''
      });
    } else {
      setEditingRepair(null);
      setFormData({
        customer_id: '',
        device: '',
        issue_description: '',
        cost: 0,
        assigned_technician: '',
        notes: ''
      });
    }
    setShowModal(true);
    setShowNewCustomerForm(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRepair(null);
    setShowNewCustomerForm(false);
    setNewCustomerData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      alert('Please provide at least customer name and phone number');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/customers`, newCustomerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh customers list
      await fetchCustomers();
      
      // Select the newly created customer
      setFormData({ ...formData, customer_id: response.data.id });
      
      // Reset and hide new customer form
      setNewCustomerData({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
      setShowNewCustomerForm(false);
      
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  const updateStatus = async (repairId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/repairs/${repairId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRepairs();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <div data-testid="repairs-page">
      <div className="page-header">
        <h1>Repair Jobs</h1>
        <p>Track and manage device repairs</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search repairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="repairs-search"
            />
          </div>
          <button 
            className="btn btn-success" 
            onClick={() => openModal()}
            data-testid="add-repair-btn"
          >
            <Plus size={18} />
            New Repair Job
          </button>
        </div>

        <div className="table-container">
          {filteredRepairs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔧</div>
              <h3>No repair jobs found</h3>
              <p>Start by creating your first repair job</p>
            </div>
          ) : (
            <table data-testid="repairs-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Device</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Cost</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id} data-testid={`repair-${repair.id}`}>
                    <td>{repair.customer_name}</td>
                    <td>{repair.device}</td>
                    <td>{repair.issue_description}</td>
                    <td>
                      <select
                        className={`badge ${repair.status}`}
                        value={repair.status}
                        onChange={(e) => updateStatus(repair.id, e.target.value)}
                        data-testid={`status-${repair.id}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                    <td>{repair.assigned_technician || '-'}</td>
                    <td>${repair.cost.toFixed(2)}</td>
                    <td>{new Date(repair.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon"
                          onClick={() => openModal(repair)}
                          data-testid={`edit-repair-${repair.id}`}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(repair.id)}
                          data-testid={`delete-repair-${repair.id}`}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="repair-modal">
            <div className="modal-header">
              <h2>{editingRepair ? 'Edit Repair Job' : 'New Repair Job'}</h2>
              <button className="btn-close" onClick={closeModal} data-testid="close-modal-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      required={!showNewCustomerForm}
                      disabled={showNewCustomerForm}
                      data-testid="repair-customer-select"
                      style={{ flex: 1 }}
                    >
                      <option value="">Select customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                      style={{ 
                        padding: '8px 16px',
                        whiteSpace: 'nowrap',
                        fontSize: '0.9rem'
                      }}
                    >
                      {showNewCustomerForm ? 'Select Existing' : '+ Add New'}
                    </button>
                  </div>
                </div>

                {showNewCustomerForm && (
                  <div style={{ 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#334155' }}>
                      New Customer Details
                    </h3>
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        value={newCustomerData.name}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                        placeholder="Customer name"
                        required={showNewCustomerForm}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                        type="tel"
                        value={newCustomerData.phone}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                        placeholder="Phone number"
                        required={showNewCustomerForm}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={newCustomerData.email}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                        placeholder="Email address (optional)"
                      />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        value={newCustomerData.address}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                        placeholder="Address (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleAddNewCustomer}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      Add Customer
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label>Device</label>
                  <input
                    type="text"
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    required
                    placeholder="e.g., iPhone 13 Pro"
                    data-testid="repair-device-input"
                  />
                </div>
                <div className="form-group">
                  <label>Issue Description</label>
                  <textarea
                    value={formData.issue_description}
                    onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                    required
                    placeholder="Describe the issue..."
                    data-testid="repair-issue-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                      required
                      data-testid="repair-cost-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Assigned Technician</label>
                    <input
                      type="text"
                      value={formData.assigned_technician}
                      onChange={(e) => setFormData({ ...formData, assigned_technician: e.target.value })}
                      placeholder="Technician name"
                      data-testid="repair-technician-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    data-testid="repair-notes-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" data-testid="save-repair-btn">
                  {editingRepair ? 'Update' : 'Create'} Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;