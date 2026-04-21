import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Package, Wrench, Users, Crown, Ticket } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    today_sales: 0,
    today_transactions: 0,
    pending_repairs: 0,
    low_stock_items: 0,
    total_stock_items: 0,
    total_customers: 0
  });
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStats(), fetchTopCustomers()]).finally(() => setLoading(false));
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
    }
  };

  const fetchTopCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/top-customers?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching top customers:', error);
    }
  };

  const goCreateCoupon = (customerId) => {
    // Customers page reads this query param and auto-opens the coupon modal.
    window.location.href = `/customers?coupon_for=${encodeURIComponent(customerId)}`;
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

        <div className="stat-card" data-testid="stat-stock-items">
          <div className="stat-card-header">
            <h3>Stock Items</h3>
            <div className="stat-icon blue">
              <Package size={20} color="white" />
            </div>
          </div>
          <div className="stat-value" data-testid="stock-items-value">
            {stats.total_stock_items}
          </div>
          <div className="stat-label">
            {stats.low_stock_items > 0 ? `${stats.low_stock_items} low stock` : 'All stocked'}
          </div>
        </div>

        <div className="stat-card" data-testid="stat-total-customers">
          <div className="stat-card-header">
            <h3>Total Customers</h3>
            <div className="stat-icon green">
              <Users size={20} color="white" />
            </div>
          </div>
          <div className="stat-value" data-testid="total-customers-value">
            {stats.total_customers}
          </div>
          <div className="stat-label">Registered</div>
        </div>

        <div className="stat-card" data-testid="stat-pending-repairs">
          <div className="stat-card-header">
            <h3>Pending Repairs</h3>
            <div className="stat-icon orange">
              <Wrench size={20} color="white" />
            </div>
          </div>
          <div className="stat-value" data-testid="pending-repairs-value">
            {stats.pending_repairs}
          </div>
          <div className="stat-label">Active jobs</div>
        </div>
      </div>

      <div
        className="card"
        data-testid="top-customers-card"
        style={{ marginBottom: '24px' }}
      >
        <div
          className="card-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Crown size={20} color="#f59e0b" />
            Top Customers
          </h2>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            by total spend • click 🎫 to generate a personalized coupon
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {topCustomers.length === 0 ? (
            <p style={{ padding: '20px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
              No customer sales yet — top customers will appear here after your first completed sales.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Contact</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Orders</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Total Spent</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c) => {
                    const rankColor = c.rank === 1 ? '#f59e0b' : c.rank === 2 ? '#94a3b8' : c.rank === 3 ? '#b45309' : '#9ca3af';
                    return (
                      <tr
                        key={c.customer_id}
                        data-testid={`top-customer-row-${c.customer_id}`}
                        style={{ borderBottom: '1px solid #f3f4f6' }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: rankColor,
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}>{c.rank}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{c.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                          {c.phone || '—'}
                          {c.email ? <div style={{ fontSize: '11px' }}>{c.email}</div> : null}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', textAlign: 'right' }}>{c.sales_count}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#059669', textAlign: 'right' }}>
                          ${c.total_spent.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            data-testid={`top-customer-coupon-${c.customer_id}`}
                            onClick={() => goCreateCoupon(c.customer_id)}
                            title="Generate personalized coupon"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: '#7c3aed',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Ticket size={12} />
                            Coupon
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
              <Package size={18} />
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