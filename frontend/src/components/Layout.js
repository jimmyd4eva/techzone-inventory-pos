import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Wrench, Users, FileText, LogOut } from 'lucide-react';

const Layout = ({ user, onLogout }) => {
  return (
    <div className="layout">
      <aside className="sidebar" data-testid="sidebar">
        <div className="sidebar-logo">
          <img 
            src="/techzone-logo.jpg" 
            alt="Techzone Logo" 
            style={{ 
              width: '288px', 
              height: 'auto', 
              borderRadius: '8px', 
              objectFit: 'cover',
              marginBottom: '8px'
            }}
          />
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.9)', 
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            30 Giltress Street, Kingston 2
          </p>
          <h1 data-testid="app-title" style={{ margin: 0, fontSize: '1.5rem' }}>
            <span style={{ color: '#1e3a8a' }}>Tech</span>
            <span style={{ color: '#dc2626' }}>zone</span>
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
              <NavLink to="/repairs" data-testid="nav-repairs">
                <Wrench size={20} />
                Repairs
              </NavLink>
            </li>
            <li>
              <NavLink to="/customers" data-testid="nav-customers">
                <Users size={20} />
                Customers
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" data-testid="nav-reports">
                <FileText size={20} />
                Reports
              </NavLink>
            </li>
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