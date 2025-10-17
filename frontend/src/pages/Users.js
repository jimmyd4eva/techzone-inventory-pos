import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, UserPlus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cashier'
  });
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403) {
        alert('You do not have permission to view users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editingUser) {
        // Update user
        const updateData = {
          username: formData.username,
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await axios.put(`${API}/users/${editingUser.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new user
        await axios.post(`${API}/auth/register`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchUsers();
      closeModal();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.detail || 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.detail || 'Error deleting user');
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'cashier'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  // Check if user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div data-testid="users-page">
        <div className="page-header">
          <h1>Access Denied</h1>
          <p>You do not have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="users-page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage system users and their roles</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="users-search"
            />
          </div>
          <button 
            className="btn btn-success" 
            onClick={() => openModal()}
            data-testid="add-user-btn"
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>

        <div className="table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No users found</h3>
              <p>Start by adding your first user</p>
            </div>
          ) : (
            <table data-testid="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} data-testid={`user-${user.id}`}>
                    <td>
                      {user.username}
                      {user.id === currentUser.id && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '0.85rem', 
                          color: '#667eea',
                          fontWeight: '600'
                        }}>
                          (You)
                        </span>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role}`} style={{ textTransform: 'capitalize' }}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon"
                          onClick={() => openModal(user)}
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit2 size={18} />
                        </button>
                        {user.id !== currentUser.id && (
                          <button 
                            className="btn-icon delete"
                            onClick={() => handleDelete(user.id)}
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="user-modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="btn-close" onClick={closeModal} data-testid="close-modal-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    data-testid="user-username-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="user-email-input"
                  />
                </div>
                <div className="form-group">
                  <label>Password {editingUser && '(leave blank to keep current)'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    data-testid="user-password-input"
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    data-testid="user-role-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="technician">Technician</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" data-testid="save-user-btn">
                  {editingUser ? 'Update' : 'Add'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
