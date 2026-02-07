import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container" data-testid="login-form">
        <div className="login-logo">
          <div style={{ overflow: 'hidden', height: '100px', marginBottom: '8px' }}>
            <img 
              src="/techzone-logo.jpg" 
              alt="Techzone Logo" 
              style={{ 
                width: '288px', 
                height: 'auto', 
                borderRadius: '12px', 
                objectFit: 'cover',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: '#64748b', 
            marginBottom: '4px',
            lineHeight: '1.4'
          }}>
            30 Giltress Street, Kingston 2, JA
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#64748b', 
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            876-633-9251 / 876-843-2416
          </p>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
            <span style={{ color: '#1e3a8a' }}>Tech</span>
            <span style={{ color: '#dc2626' }}>zone</span>
            {' '}
            <span style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Inventory</span>
          </h1>
          <p>Sign in to continue</p>
        </div>

        {error && <div className="error-message" data-testid="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              data-testid="username-input"
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              data-testid="password-input"
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            data-testid="login-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;