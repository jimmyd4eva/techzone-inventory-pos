import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Settings as SettingsIcon, Save, Percent, DollarSign, Building,
  Star, Shield, Wallet
} from 'lucide-react';

import BusinessInfoTab from './settings/BusinessInfoTab';
import CashRegisterTab from './settings/CashRegisterTab';
import PricingTab from './settings/PricingTab';
import TaxTab from './settings/TaxTab';
import PointsSystemTab from './settings/PointsSystemTab';
import DevicesTab from './settings/DevicesTab';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    points_value: 1,
    dual_pricing_enabled: false,
    cash_discount_percent: 0,
    card_surcharge_percent: 0,
    shift_report_email_enabled: false,
    shift_report_email: '',
    auto_summary_weekly_enabled: false,
    auto_summary_monthly_enabled: false,
    loyalty_emails_enabled: false,
    followup_emails_enabled: false,
    followup_days: 14,
    google_review_url: ''
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

  // Cash Register State
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftTransactions, setShiftTransactions] = useState([]);
  const [shiftTotals, setShiftTotals] = useState({});
  const [shiftHistory, setShiftHistory] = useState([]);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('payout');
  const [transactionDesc, setTransactionDesc] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeSection === 'devices') {
      fetchDevices();
    }
    if (activeSection === 'register') {
      fetchCurrentShift();
      fetchShiftHistory();
    }
  }, [activeSection]);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  // Cash Register
  const fetchCurrentShift = async () => {
    setLoadingRegister(true);
    try {
      const response = await axios.get(`${API}/cash-register/current`, { headers: authHeaders() });
      setCurrentShift(response.data.shift);
      setShiftTransactions(response.data.transactions || []);
      setShiftTotals(response.data.totals || {});
    } catch (error) {
      console.error('Error fetching current shift:', error);
    } finally {
      setLoadingRegister(false);
    }
  };

  const fetchShiftHistory = async () => {
    try {
      const response = await axios.get(`${API}/cash-register/history?limit=10`, { headers: authHeaders() });
      setShiftHistory(response.data);
    } catch (error) {
      console.error('Error fetching shift history:', error);
    }
  };

  const handleOpenShift = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid opening amount' });
      return;
    }
    try {
      await axios.post(`${API}/cash-register/open`,
        { opening_amount: parseFloat(openingAmount) },
        { headers: authHeaders() }
      );
      setMessage({ type: 'success', text: 'Shift opened successfully!' });
      setOpeningAmount('');
      fetchCurrentShift();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to open shift' });
    }
  };

  const handleCloseShift = async () => {
    if (!closingAmount || parseFloat(closingAmount) < 0) {
      setMessage({ type: 'error', text: 'Please enter the actual cash count' });
      return;
    }
    if (!window.confirm('Are you sure you want to close this shift? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await axios.post(`${API}/cash-register/close`,
        { closing_amount: parseFloat(closingAmount), notes: closingNotes },
        { headers: authHeaders() }
      );
      const summary = response.data.summary;
      const status = summary.difference > 0 ? 'OVER' : summary.difference < 0 ? 'SHORT' : 'BALANCED';
      setMessage({
        type: summary.difference === 0 ? 'success' : 'error',
        text: `Shift closed. Register is ${status} by $${Math.abs(summary.difference).toFixed(2)}`
      });
      setClosingAmount('');
      setClosingNotes('');
      fetchCurrentShift();
      fetchShiftHistory();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to close shift' });
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    try {
      await axios.post(`${API}/cash-register/transaction`,
        {
          transaction_type: transactionType,
          amount: parseFloat(transactionAmount),
          description: transactionDesc
        },
        { headers: authHeaders() }
      );
      setMessage({ type: 'success', text: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} recorded!` });
      setTransactionAmount('');
      setTransactionDesc('');
      fetchCurrentShift();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to record transaction' });
    }
  };

  const exportShiftReport = async (shiftId) => {
    try {
      const response = await axios.get(`${API}/cash-register/report/${shiftId}`, {
        headers: authHeaders(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cash_register_report_${shiftId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Report downloaded successfully!' });
    } catch (error) {
      console.error('Error exporting report:', error);
      setMessage({ type: 'error', text: 'Failed to export report' });
    }
  };

  // Devices
  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const response = await axios.get(`${API}/activation/list`, { headers: authHeaders() });
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setMessage({ type: 'error', text: 'Failed to load activated devices' });
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to revoke this device activation? The user will need to re-activate.')) {
      return;
    }
    setRevokingDevice(deviceId);
    try {
      await axios.delete(`${API}/activation/revoke/${encodeURIComponent(deviceId)}`, { headers: authHeaders() });
      setDevices(devices.filter(d => d.device_id !== deviceId));
      setMessage({ type: 'success', text: 'Device activation revoked successfully' });
    } catch (error) {
      console.error('Error revoking device:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to revoke device' });
    } finally {
      setRevokingDevice(null);
    }
  };

  const exportDevices = () => {
    const csvContent = [
      ['Device ID', 'Activated Email', 'Activation Code', 'Activated At'].join(','),
      ...devices.map(d => [
        d.device_id,
        d.activated_email,
        d.activation_code,
        new Date(d.activated_at).toLocaleString()
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activated_devices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Settings
  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`, { headers: authHeaders() });
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
        points_value: response.data.points_value || 1,
        dual_pricing_enabled: response.data.dual_pricing_enabled === true,
        cash_discount_percent: response.data.cash_discount_percent || 0,
        card_surcharge_percent: response.data.card_surcharge_percent || 0,
        shift_report_email_enabled: response.data.shift_report_email_enabled === true,
        shift_report_email: response.data.shift_report_email || '',
        auto_summary_weekly_enabled: response.data.auto_summary_weekly_enabled === true,
        auto_summary_monthly_enabled: response.data.auto_summary_monthly_enabled === true,
        loyalty_emails_enabled: response.data.loyalty_emails_enabled === true,
        followup_emails_enabled: response.data.followup_emails_enabled === true,
        followup_days: response.data.followup_days || 14,
        google_review_url: response.data.google_review_url || ''
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload a JPG, PNG, GIF, WebP, or SVG image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API}/upload/logo`, formData, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      const logoUrl = `${BACKEND_URL}${response.data.logo_url}`;
      setSettings({ ...settings, business_logo: logoUrl });
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to upload logo' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
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
        points_value: settings.points_value,
        dual_pricing_enabled: settings.dual_pricing_enabled,
        cash_discount_percent: settings.cash_discount_percent,
        card_surcharge_percent: settings.card_surcharge_percent,
        shift_report_email_enabled: settings.shift_report_email_enabled,
        shift_report_email: settings.shift_report_email || null,
        auto_summary_weekly_enabled: settings.auto_summary_weekly_enabled,
        auto_summary_monthly_enabled: settings.auto_summary_monthly_enabled,
        loyalty_emails_enabled: settings.loyalty_emails_enabled,
        followup_emails_enabled: settings.followup_emails_enabled,
        followup_days: settings.followup_days,
        google_review_url: settings.google_review_url || null
      }, { headers: authHeaders() });
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
    setSettings({
      ...settings,
      tax_exempt_categories: isExempt
        ? currentExemptions.filter(c => c !== categoryId)
        : [...currentExemptions, categoryId]
    });
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

  const sectionButtons = [
    { id: 'business', label: 'Business Info', icon: Building },
    { id: 'register', label: 'Cash Register', icon: Wallet },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'tax', label: 'Tax', icon: Percent },
    { id: 'points', label: 'Points System', icon: Star },
    { id: 'devices', label: 'Devices', icon: Shield }
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

        {activeSection === 'business' && (
          <BusinessInfoTab
            settings={settings}
            setSettings={setSettings}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
          />
        )}

        {activeSection === 'register' && (
          <CashRegisterTab
            settings={settings}
            setSettings={setSettings}
            currentShift={currentShift}
            shiftTransactions={shiftTransactions}
            shiftTotals={shiftTotals}
            shiftHistory={shiftHistory}
            loadingRegister={loadingRegister}
            openingAmount={openingAmount}
            setOpeningAmount={setOpeningAmount}
            closingAmount={closingAmount}
            setClosingAmount={setClosingAmount}
            closingNotes={closingNotes}
            setClosingNotes={setClosingNotes}
            transactionAmount={transactionAmount}
            setTransactionAmount={setTransactionAmount}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            transactionDesc={transactionDesc}
            setTransactionDesc={setTransactionDesc}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            handleOpenShift={handleOpenShift}
            handleCloseShift={handleCloseShift}
            handleAddTransaction={handleAddTransaction}
            exportShiftReport={exportShiftReport}
          />
        )}

        {activeSection === 'pricing' && (
          <PricingTab settings={settings} setSettings={setSettings} />
        )}

        {activeSection === 'tax' && (
          <TaxTab
            settings={settings}
            setSettings={setSettings}
            toggleCategoryExemption={toggleCategoryExemption}
          />
        )}

        {activeSection === 'points' && (
          <PointsSystemTab settings={settings} setSettings={setSettings} />
        )}

        {activeSection === 'devices' && (
          <DevicesTab
            devices={devices}
            loadingDevices={loadingDevices}
            revokingDevice={revokingDevice}
            fetchDevices={fetchDevices}
            handleRevokeDevice={handleRevokeDevice}
            exportDevices={exportDevices}
          />
        )}

        {activeSection !== 'devices' && (
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
        )}
      </div>
    </div>
  );
};

export default Settings;
