import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Wrench, Users as UsersIcon, FileText, LogOut, UserCog, Receipt, Settings, Ticket } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Layout = ({ user, onLogout }) => {
  const [businessSettings, setBusinessSettings] = useState({
    business_name: 'TECHZONE',
    business_address: '30 Giltress Street, Kingston 2, JA',
    business_phone: '876-633-9251 / 876-843-2416',
    business_logo: '/techzone-logo.jpg'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinessSettings({
        business_name: response.data.business_name || 'TECHZONE',
        business_address: response.data.business_address || '30 Giltress Street, Kingston 2, JA',
        business_phone: response.data.business_phone || '876-633-9251 / 876-843-2416',
        business_logo: response.data.business_logo || '/techzone-logo.jpg'
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Split business name for colored display
  const nameParts = businessSettings.business_name.split('');
  const midPoint = Math.ceil(nameParts.length / 2);
  const firstPart = nameParts.slice(0, midPoint).join('');
  const secondPart = nameParts.slice(midPoint).join('');

  return (
    <div className="layout">
      <aside className="sidebar" data-testid="sidebar">
        <div className="sidebar-logo">
          <div style={{ overflow: 'hidden', height: '80px', marginBottom: '8px' }}>
            <img 
              src={businessSettings.business_logo || '/techzone-logo.jpg'} 
              alt={`${businessSettings.business_name} Logo`}
              style={{ 
                width: '288px', 
                height: 'auto', 
                borderRadius: '8px', 
                objectFit: 'cover'
              }}
              onError={(e) => { e.target.src = '/techzone-logo.jpg'; }}
            />
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '4px',
            lineHeight: '1.4'
          }}>
            {businessSettings.business_address}
          </p>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            {businessSettings.business_phone}
          </p>
          <h1 data-testid="app-title" style={{ margin: 0, fontSize: '1.5rem' }}>
            <span style={{ color: '#1e3a8a' }}>{firstPart}</span>
            <span style={{ color: '#dc2626' }}>{secondPart}</span>
          </h1>
          <p>Inventory System</p>
        </div>
        
        <nav>
          <ul className="sidebar-nav">
            <li>
              <NavLink to="/" end data-testid="nav-dashboard">
                <LayoutDashboard size={20} />
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/inventory" data-testid="nav-inventory">
                <Package size={20} />
                Inventory
              </NavLink>
            </li>
            <li>
              <NavLink to="/sales" data-testid="nav-sales">
                <ShoppingCart size={20} />
                Sales
              </NavLink>
            </li>
            <li>
              <NavLink to="/sales-history" data-testid="nav-sales-history">
                <Receipt size={20} />
                Sales History
              </NavLink>
            </li>
            <li>
              <NavLink to="/repairs" data-testid="nav-repairs">
                <Wrench size={20} />
                Repairs
              </NavLink>
            </li>
            <li>
              <NavLink to="/customers" data-testid="nav-customers">
                <UsersIcon size={20} />
                Customers
              </NavLink>
            </li>
            <li>
              <NavLink to="/coupons" data-testid="nav-coupons">
                <Ticket size={20} />
                Coupons
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" data-testid="nav-reports">
                <FileText size={20} />
                Reports
              </NavLink>
            </li>
            {user?.role === 'admin' && (
              <li>
                <NavLink to="/users" data-testid="nav-users">
                  <UserCog size={20} />
                  Users
                </NavLink>
              </li>
            )}
            {user?.role === 'admin' && (
              <li>
                <NavLink to="/settings" data-testid="nav-settings">
                  <Settings size={20} />
                  Settings
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" data-testid="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <h4 data-testid="user-name">{user?.username}</h4>
              <p data-testid="user-role">{user?.role}</p>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout} data-testid="logout-button">
            <LogOut size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Logout
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;