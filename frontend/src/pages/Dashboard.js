import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingBag, Wrench, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    today_sales: 0,
    today_transactions: 0,
    pending_repairs: 0,
    low_stock_items: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" data-testid="stat-today-sales">
          <div className="stat-card-header">
            <h3>Today's Sales</h3>
            <div className="stat-icon purple">
              <DollarSign size={20} color="white" />
            </div>
          </div>
          <div className="stat-value" data-testid="today-sales-value">
            ${stats.today_sales.toFixed(2)}
          </div>
          <div className="stat-label">
            {stats.today_transactions} transactions
          </div>
        </div>

        <div className="stat-card" data-testid="stat-pending-repairs">
          <div className="stat-card-header">
            <h3>Pending Repairs</h3>
            <div className="stat-icon blue">
              <Wrench size={20} color="white" />
            </div>
          </div>
          <div className="stat-value" data-testid="pending-repairs-value">
            {stats.pending_repairs}
          </div>
          <div className="stat-label">Active jobs</div>
        </div>

        <div className="stat-card" data-testid="stat-low-stock">
          <div className="stat-card-header">
            <h3>Low Stock Items</h3>
            <div className="stat-icon orange">
              <AlertTriangle size={20} color="white" />
            </div>
          </div>
          <div className="stat-value" data-testid="low-stock-value">
            {stats.low_stock_items}
          </div>
          <div className="stat-label">Need reorder</div>
        </div>

        <div className="stat-card" data-testid="stat-total-customers">
          <div className="stat-card-header">
            <h3>Total Customers</h3>
            <div className="stat-icon green">
              <ShoppingBag size={20} color="white" />
            </div>
          </div>
          <div className="stat-value" data-testid="total-customers-value">
            {stats.total_customers}
          </div>
          <div className="stat-label">Registered</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-success"
              onClick={() => window.location.href = '/sales'}
              data-testid="quick-new-sale-btn"
            >
              <ShoppingBag size={18} />
              New Sale
            </button>
            <button 
              className="btn btn-success"
              onClick={() => window.location.href = '/repairs'}
              data-testid="quick-new-repair-btn"
            >
              <Wrench size={18} />
              New Repair Job
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/inventory'}
              data-testid="quick-manage-inventory-btn"
            >
              Manage Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;