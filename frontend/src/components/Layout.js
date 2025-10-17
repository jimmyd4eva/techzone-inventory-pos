import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Wrench, Users, FileText, LogOut } from 'lucide-react';

const Layout = ({ user, onLogout }) => {
  return (
    <div className="layout">
      <aside className="sidebar" data-testid="sidebar">
        <div className="sidebar-logo">
          <h1 data-testid="app-title">Techzone</h1>
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