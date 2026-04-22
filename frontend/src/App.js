import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';

// Send the httpOnly auth cookie on every API call. The cookie is set by
// /api/auth/login and cleared by /api/auth/logout. This is safer than
// localStorage (not readable by JS → immune to XSS token theft).
axios.defaults.withCredentials = true;
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import SalesHistory from './pages/SalesHistory';
import Repairs from './pages/Repairs';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Coupons from './pages/Coupons';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentSuccessPayPal from './pages/PaymentSuccessPayPal';
import Layout from './components/Layout';
import Activation from './pages/Activation';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Generate device ID (same as in Activation.js)
const getDeviceId = () => {
  const stored = localStorage.getItem('device_id');
  if (stored) return stored;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('TechZone', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasData.slice(-50)
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const deviceId = 'DEV-' + Math.abs(hash).toString(36).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  localStorage.setItem('device_id', deviceId);
  return deviceId;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [checkingActivation, setCheckingActivation] = useState(true);

  // Check device activation status
  useEffect(() => {
    const checkActivation = async () => {
      const deviceId = getDeviceId();
      
      // First check local storage for cached activation
      const cachedActivation = localStorage.getItem('device_activated');
      if (cachedActivation === 'true') {
        // Verify with server
        try {
          const response = await axios.post(`${API_URL}/api/activation/check`, {
            device_id: deviceId
          });
          if (response.data.is_activated) {
            setIsActivated(true);
          } else {
            // Server says not activated, clear local cache
            localStorage.removeItem('device_activated');
            setIsActivated(false);
          }
        } catch (err) {
          // If server unreachable, trust local cache
          console.log('Could not verify activation with server');
          setIsActivated(true);
        }
      } else {
        // No local cache, check server
        try {
          const response = await axios.post(`${API_URL}/api/activation/check`, {
            device_id: deviceId
          });
          if (response.data.is_activated) {
            localStorage.setItem('device_activated', 'true');
            setIsActivated(true);
          }
        } catch (err) {
          console.log('Could not check activation status');
        }
      }
      setCheckingActivation(false);
    };

    checkActivation();
  }, []);

  useEffect(() => {
    // Auth state now lives in an httpOnly cookie (not localStorage). Hydrate
    // the user by calling /auth/me — the cookie is sent automatically because
    // `axios.defaults.withCredentials = true`. If the cookie is missing,
    // expired, or revoked, we clear any stale cached `user` object and stay
    // on the login screen.
    const hydrate = async () => {
      const cachedUser = localStorage.getItem('user');
      if (!cachedUser) {
        setLoading(false);
        return;
      }
      try {
        const me = await axios.get(`${API_URL}/api/auth/me`);
        setUser(me.data);
        localStorage.setItem('user', JSON.stringify(me.data));
      } catch {
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, []);

  const handleLogin = (userData) => {
    // We no longer store the JWT in localStorage — the backend sets an
    // httpOnly cookie `techzone_token` that JavaScript cannot read, which
    // closes the classic XSS token-theft attack surface. Only the non-
    // sensitive user profile is cached locally so the UI can render instantly
    // on the next boot while /auth/me re-validates.
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch (e) {
      // Non-fatal — the backend request may fail if already logged out / offline.
      console.debug('logout endpoint failed:', e?.message);
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleActivated = () => {
    setIsActivated(true);
  };

  // Show loading while checking activation and auth
  if (loading || checkingActivation) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Show activation screen if device is not activated
  if (!isActivated) {
    return <Activation onActivated={handleActivated} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/"
          element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales-history" element={<SalesHistory />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="payment-success" element={<PaymentSuccess />} />
          <Route path="payment-success-paypal" element={<PaymentSuccessPayPal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;