import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Save, Percent, DollarSign, Tag, Check, Building, Phone, Image, Star, Upload, Shield, Trash2, Download, RefreshCw, Monitor } from 'lucide-react';
import { Switch } from '../components/ui/switch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Available product categories
const PRODUCT_CATEGORIES = [
  { id: 'phone', label: 'Phones', description: 'Mobile phones and smartphones' },
  { id: 'part', label: 'Parts', description: 'Replacement parts and components' },
  { id: 'accessory', label: 'Accessories', description: 'Phone cases, chargers, etc.' },
  { id: 'screen', label: 'Screens', description: 'Screen replacements' },
  { id: 'other', label: 'Other', description: 'Miscellaneous items' }
];

const Settings = () => {
  const [settings, setSettings] = useState({
    tax_rate: 0,
    tax_enabled: false,
    currency: 'USD',
    tax_exempt_categories: [],
    business_name: 'TECHZONE',
    business_address: '',
    business_phone: '',
    business_logo: '',
    points_enabled: false,
    points_redemption_threshold: 3500,
    points_value: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('business');
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [revokingDevice, setRevokingDevice] = useState(null);
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings({
        tax_rate: (response.data.tax_rate || 0) * 100,
        tax_enabled: response.data.tax_enabled === true,
        currency: response.data.currency || 'USD',
        tax_exempt_categories: response.data.tax_exempt_categories || [],
        business_name: response.data.business_name || 'TECHZONE',
        business_address: response.data.business_address || '',
        business_phone: response.data.business_phone || '',
        business_logo: response.data.business_logo || '',
        points_enabled: response.data.points_enabled === true,
        points_redemption_threshold: response.data.points_redemption_threshold || 3500,
        points_value: response.data.points_value || 1
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload a JPG, PNG, GIF, WebP, or SVG image.' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/logo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update settings with new logo URL
      const logoUrl = `${BACKEND_URL}${response.data.logo_url}`;
      setSettings({ ...settings, business_logo: logoUrl });
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to upload logo' });
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/settings`, {
        tax_rate: settings.tax_rate / 100,
        tax_enabled: settings.tax_enabled,
        currency: settings.currency,
        tax_exempt_categories: settings.tax_exempt_categories,
        business_name: settings.business_name,
        business_address: settings.business_address,
        business_phone: settings.business_phone,
        business_logo: settings.business_logo || null,
        points_enabled: settings.points_enabled,
        points_redemption_threshold: settings.points_redemption_threshold,
        points_value: settings.points_value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryExemption = (categoryId) => {
    const currentExemptions = settings.tax_exempt_categories;
    const isExempt = currentExemptions.includes(categoryId);
    
    if (isExempt) {
      setSettings({
        ...settings,
        tax_exempt_categories: currentExemptions.filter(c => c !== categoryId)
      });
    } else {
      setSettings({
        ...settings,
        tax_exempt_categories: [...currentExemptions, categoryId]
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="page-container" data-testid="settings-page">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          color: '#6b7280'
        }}>
          <SettingsIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h2>Access Denied</h2>
          <p>Only administrators can access settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container" data-testid="settings-page">
        <div className="loading-spinner" style={{ margin: '100px auto' }}></div>
      </div>
    );
  }

  const taxableCategories = PRODUCT_CATEGORIES.filter(
    c => !settings.tax_exempt_categories.includes(c.id)
  );

  const sectionButtons = [
    { id: 'business', label: 'Business Info', icon: Building },
    { id: 'tax', label: 'Tax', icon: Percent },
    { id: 'points', label: 'Points System', icon: Star }
  ];

  return (
    <div className="page-container" data-testid="settings-page">
      <div className="page-header">
        <h1 data-testid="settings-title">
          <SettingsIcon size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          Settings
        </h1>
      </div>

      <div style={{ maxWidth: '700px' }}>
        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {sectionButtons.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              data-testid={`section-${section.id}`}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeSection === section.id ? '#8b5cf6' : '#f3f4f6',
                color: activeSection === section.id ? '#fff' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
        </div>

        {message.text && (
          <div
            data-testid="settings-message"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}
          >
            {message.text}
          </div>
        )}

        {/* Business Info Section */}
        {activeSection === 'business' && (
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={20} />
              Business Information
            </h2>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                Business Name
              </label>
              <input
                type="text"
                data-testid="business-name-input"
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                Address
              </label>
              <textarea
                data-testid="business-address-input"
                value={settings.business_address}
                onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  data-testid="business-phone-input"
                  value={settings.business_phone}
                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                Logo
              </label>
              
              {/* File Upload Option */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  data-testid="logo-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1
                  }}
                  data-testid="upload-logo-btn"
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload from Computer'}
                </button>
                <span style={{ 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  alignSelf: 'center' 
                }}>
                  or enter URL below
                </span>
              </div>

              {/* URL Input Option */}
              <div style={{ position: 'relative' }}>
                <Image size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  data-testid="business-logo-input"
                  value={settings.business_logo}
                  onChange={(e) => setSettings({ ...settings, business_logo: e.target.value })}
                  placeholder="https://example.com/logo.png or upload a file above"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Supported formats: JPG, PNG, GIF, WebP, SVG (max 5MB)
              </p>

              {settings.business_logo && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Logo Preview:</p>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, business_logo: '' })}
                      style={{
                        fontSize: '12px',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <img 
                    src={settings.business_logo} 
                    alt="Logo preview" 
                    style={{ maxHeight: '80px', maxWidth: '250px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <p style={{ display: 'none', fontSize: '13px', color: '#ef4444' }}>
                    Failed to load image. Please check the URL.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tax Section */}
        {activeSection === 'tax' && (
        <>
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
            Tax Configuration
          </h2>

          {/* Tax Enabled Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                Enable Tax
              </span>
              <Switch
                data-testid="tax-toggle"
                checked={settings.tax_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_enabled: checked }))}
                className="data-[state=checked]:bg-violet-500"
              />
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              When enabled, tax will be applied to sales based on product category
            </p>
          </div>

          {/* Tax Rate Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
              Tax Rate
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                data-testid="tax-rate-input"
                value={settings.tax_rate}
                onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                disabled={!settings.tax_enabled}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: settings.tax_enabled ? '#fff' : '#f3f4f6',
                  color: settings.tax_enabled ? '#111827' : '#9ca3af'
                }}
              />
              <Percent
                size={18}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
            </div>
          </div>

          {/* Currency Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
              Currency
            </label>
            <div style={{ position: 'relative' }}>
              <select
                data-testid="currency-select"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="JMD">JMD - Jamaican Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
              <DollarSign
                size={18}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
            </div>
          </div>
        </div>

        {/* Category Tax Exemptions */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px', opacity: settings.tax_enabled ? 1 : 0.6 }}>
          <h2 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={20} />
            Category Tax Exemptions
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
            Select categories that should be <strong>exempt from tax</strong>. Unchecked categories will have tax applied.
          </p>

          <div style={{ display: 'grid', gap: '12px' }}>
            {PRODUCT_CATEGORIES.map((category) => {
              const isExempt = settings.tax_exempt_categories.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  data-testid={`category-${category.id}`}
                  onClick={() => settings.tax_enabled && toggleCategoryExemption(category.id)}
                  disabled={!settings.tax_enabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    border: `2px solid ${isExempt ? '#8b5cf6' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    backgroundColor: isExempt ? '#f5f3ff' : '#fff',
                    cursor: settings.tax_enabled ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '600', 
                      color: isExempt ? '#7c3aed' : '#374151',
                      marginBottom: '2px'
                    }}>
                      {category.label}
                      {isExempt && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: '#8b5cf6',
                          color: '#fff',
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          TAX EXEMPT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {category.description}
                    </div>
                  </div>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: `2px solid ${isExempt ? '#8b5cf6' : '#d1d5db'}`,
                    backgroundColor: isExempt ? '#8b5cf6' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isExempt && <Check size={14} color="#fff" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="card" style={{ padding: '24px', marginBottom: '24px', backgroundColor: '#f9fafb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '12px' }}>
            Tax Configuration Preview
          </h3>
          {!settings.tax_enabled ? (
            <p style={{ fontSize: '15px', color: '#374151' }} data-testid="tax-preview">
              Tax is <strong>disabled</strong> - no tax will be applied to any sales
            </p>
          ) : (
            <div data-testid="tax-preview">
              <p style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
                Tax Rate: <strong>{settings.tax_rate}%</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                <span style={{ color: '#059669' }}>✓ Taxable:</span>{' '}
                {taxableCategories.length > 0 
                  ? taxableCategories.map(c => c.label).join(', ')
                  : 'None'}
              </p>
              <p style={{ fontSize: '14px', color: '#374151' }}>
                <span style={{ color: '#dc2626' }}>✗ Tax Exempt:</span>{' '}
                {settings.tax_exempt_categories.length > 0
                  ? PRODUCT_CATEGORIES
                      .filter(c => settings.tax_exempt_categories.includes(c.id))
                      .map(c => c.label)
                      .join(', ')
                  : 'None'}
              </p>
            </div>
          )}
        </div>
        </>
        )}

        {/* Points System Section */}
        {activeSection === 'points' && (
          <>
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} />
              Customer Loyalty Points
            </h2>

            {/* Points Enabled Toggle */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                  Enable Points System
                </span>
                <Switch
                  data-testid="points-toggle"
                  checked={settings.points_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, points_enabled: checked }))}
                  className="data-[state=checked]:bg-violet-500"
                />
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                When enabled, customers earn points on purchases
              </p>
            </div>

            {/* Spending Threshold */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                Minimum Spend to Redeem Points
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="number"
                  data-testid="points-threshold-input"
                  value={settings.points_redemption_threshold}
                  onChange={(e) => setSettings({ ...settings, points_redemption_threshold: parseFloat(e.target.value) || 0 })}
                  disabled={!settings.points_enabled}
                  min="0"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: settings.points_enabled ? '#fff' : '#f3f4f6',
                    color: settings.points_enabled ? '#111827' : '#9ca3af'
                  }}
                />
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                Customers must spend this amount total before they can use points (default: $3,500)
              </p>
            </div>

            {/* Points Value */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                Point Value ($ per point)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="number"
                  data-testid="points-value-input"
                  value={settings.points_value}
                  onChange={(e) => setSettings({ ...settings, points_value: parseFloat(e.target.value) || 1 })}
                  disabled={!settings.points_enabled}
                  min="0.01"
                  step="0.5"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: settings.points_enabled ? '#fff' : '#f3f4f6',
                    color: settings.points_enabled ? '#111827' : '#9ca3af'
                  }}
                />
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                Each point = this amount in discount (default: $1)
              </p>
            </div>
          </div>

          {/* Points Preview */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px', backgroundColor: '#faf5ff' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#7c3aed', marginBottom: '12px' }}>
              Points System Preview
            </h3>
            {!settings.points_enabled ? (
              <p style={{ fontSize: '15px', color: '#374151' }}>
                Points system is <strong>disabled</strong>
              </p>
            ) : (
              <div>
                <p style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
                  • Customers earn <strong>1 point per $500 spent</strong>
                </p>
                <p style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
                  • Points can be redeemed after spending <strong>${settings.points_redemption_threshold.toLocaleString()}</strong> total
                </p>
                <p style={{ fontSize: '15px', color: '#374151' }}>
                  • Each point is worth <strong>${settings.points_value}</strong> in discount
                </p>
              </div>
            )}
          </div>
          </>
        )}

        {/* Save Button */}
        <button
          data-testid="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
