import React, { useState, useEffect } from 'react';
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
  const [businessSettings, setBusinessSettings] = useState({
    business_name: 'TECHZONE',
    business_address: '30 Giltress Street, Kingston 2, JA',
    business_phone: '876-633-9251 / 876-843-2416',
    business_logo: '/techzone-logo.jpg'
  });

  useEffect(() => {
    fetchPublicSettings();
  }, []);

  const fetchPublicSettings = async () => {
    try {
      // Try to fetch settings without auth (for login page display)
      const response = await axios.get(`${API}/settings/public`);
      setBusinessSettings({
        business_name: response.data.business_name || 'TECHZONE',
        business_address: response.data.business_address || '30 Giltress Street, Kingston 2, JA',
        business_phone: response.data.business_phone || '876-633-9251 / 876-843-2416',
        business_logo: response.data.business_logo || '/techzone-logo.jpg'
      });
    } catch (error) {
      // Keep defaults if API fails (expected on first load)
      console.log('Using default business settings');
    }
  };

  // Split business name for colored display
  const nameParts = businessSettings.business_name.split('');
  const midPoint = Math.ceil(nameParts.length / 2);
  const firstPart = nameParts.slice(0, midPoint).join('');
  const secondPart = nameParts.slice(midPoint).join('');

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
              src={businessSettings.business_logo || '/techzone-logo.jpg'} 
              alt={`${businessSettings.business_name} Logo`}
              style={{ 
                width: '288px', 
                height: 'auto', 
                borderRadius: '12px', 
                objectFit: 'cover',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              onError={(e) => { e.target.src = '/techzone-logo.jpg'; }}
            />
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: '#64748b', 
            marginBottom: '4px',
            lineHeight: '1.4'
          }}>
            {businessSettings.business_address}
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: '#64748b', 
            marginBottom: '16px',
            lineHeight: '1.4'
          }}>
            {businessSettings.business_phone}
          </p>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
            <span style={{ color: '#1e3a8a' }}>{firstPart}</span>
            <span style={{ color: '#dc2626' }}>{secondPart}</span>
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