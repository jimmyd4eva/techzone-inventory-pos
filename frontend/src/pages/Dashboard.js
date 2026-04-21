import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Package, Wrench, Users, Crown, Ticket, AlertTriangle, PackageX, Mail, Download } from 'lucide-react';

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
  const [lostCustomers, setLostCustomers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // Purchase order modal
  const [poModal, setPoModal] = useState(null); // { supplier, items }
  const [poEmail, setPoEmail] = useState('');
  const [poNote, setPoNote] = useState('');
  const [poSending, setPoSending] = useState(false);
  const [poMsg, setPoMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    Promise.all([fetchStats(), fetchTopCustomers(), fetchLostCustomers(), fetchLowStock()])
      .finally(() => setLoading(false));
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

  const fetchLostCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/lost-customers?days=60&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLostCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching lost customers:', error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStock(response.data || []);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  const goCreateCoupon = (customerId, preset) => {
    const qs = new URLSearchParams({ coupon_for: customerId });
    if (preset) qs.set('preset', preset);
    window.location.href = `/customers?${qs.toString()}`;
  };

  // Group low-stock items by supplier name
  const groupLowStock = () => {
    const groups = {};
    lowStock.forEach((it) => {
      const key = (it.supplier && String(it.supplier).trim()) || '— No supplier —';
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  };

  const suggestedQty = (it) => Math.max((it.low_stock_threshold || 10) * 3 - (it.quantity || 0), 5);

  const downloadGroupCSV = (supplier, items) => {
    const rows = [
      ['Name', 'SKU', 'Quantity', 'Low Stock Threshold', 'Suggested Order Qty', 'Supplier'].join(','),
      ...items.map((it) => [
        `"${(it.name || '').replace(/"/g, '""')}"`,
        `"${(it.sku || '').replace(/"/g, '""')}"`,
        it.quantity || 0,
        it.low_stock_threshold || 0,
        suggestedQty(it),
        `"${String(supplier).replace(/"/g, '""')}"`,
      ].join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO_${supplier.replace(/[^\w]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPoModal = (supplier, items) => {
    setPoModal({ supplier, items });
    setPoEmail('');
    setPoNote('');
    setPoMsg({ type: '', text: '' });
  };

  const sendPO = async () => {
    if (!poEmail.trim()) {
      setPoMsg({ type: 'error', text: 'Supplier email is required' });
      return;
    }
    setPoSending(true);
    try {
      const token = localStorage.getItem('token');
      const r = await axios.post(
        `${API}/inventory/email-purchase-order`,
        {
          to_email: poEmail.trim(),
          supplier_name: poModal.supplier,
          note: poNote,
          item_ids: poModal.items.map((it) => it.id),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPoMsg({ type: 'success', text: `PO emailed to ${r.data.recipient} (${r.data.items_count} items)` });
      setTimeout(() => setPoModal(null), 1600);
    } catch (error) {
      setPoMsg({ type: 'error', text: error.response?.data?.detail || 'Failed to send PO' });
    } finally {
      setPoSending(false);
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

      {lostCustomers.length > 0 && (
        <div
          className="card"
          data-testid="lost-customers-card"
          style={{ marginBottom: '24px', border: '1px solid #fecaca' }}
        >
          <div
            className="card-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fef2f2',
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
            }}
          >
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#991b1b' }}>
              <AlertTriangle size={20} color="#dc2626" />
              At-Risk Customers
              <span
                data-testid="lost-customers-count"
                style={{
                  padding: '2px 10px',
                  background: '#dc2626',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {lostCustomers.length}
              </span>
            </h2>
            <span style={{ fontSize: '12px', color: '#991b1b' }}>
              No purchase in 60+ days • click 🎫 for a pre-filled win-back coupon
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #fecaca' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Contact</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Orders</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Total Spent</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Days Away</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lostCustomers.map((c) => {
                    const days = c.days_since_last_sale ?? 0;
                    const daysColor = days >= 180 ? '#7f1d1d' : days >= 90 ? '#b91c1c' : '#dc2626';
                    return (
                      <tr
                        key={c.customer_id}
                        data-testid={`lost-customer-row-${c.customer_id}`}
                        style={{ borderBottom: '1px solid #fee2e2' }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{c.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                          {c.phone || '—'}
                          {c.email ? <div style={{ fontSize: '11px' }}>{c.email}</div> : null}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', textAlign: 'right' }}>{c.sales_count}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>
                          ${c.total_spent.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: daysColor }}>
                          {days} days
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            data-testid={`lost-customer-coupon-${c.customer_id}`}
                            onClick={() => goCreateCoupon(c.customer_id, 'winback')}
                            title="Generate win-back coupon"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: '#dc2626',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Ticket size={12} />
                            We Miss You
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div
          className="card"
          data-testid="low-stock-card"
          style={{ marginBottom: '24px', border: '1px solid #fcd34d' }}
        >
          <div
            className="card-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fffbeb',
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
            }}
          >
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#92400e' }}>
              <PackageX size={20} color="#d97706" />
              Low Stock — Reorder Needed
              <span
                data-testid="low-stock-count"
                style={{
                  padding: '2px 10px', background: '#d97706', color: '#fff',
                  borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                }}
              >{lowStock.length}</span>
            </h2>
            <span style={{ fontSize: '12px', color: '#92400e' }}>
              Grouped by supplier • download CSV or email a purchase-order draft
            </span>
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            {groupLowStock().map(([supplier, items]) => (
              <div
                key={supplier}
                data-testid={`low-stock-group-${supplier.replace(/\W+/g, '_')}`}
                style={{ borderBottom: '1px solid #fde68a', padding: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {supplier}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {items.length} item{items.length === 1 ? '' : 's'} below threshold
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      data-testid={`download-po-${supplier.replace(/\W+/g, '_')}`}
                      onClick={() => downloadGroupCSV(supplier, items)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', background: '#f3f4f6', color: '#374151',
                        border: '1px solid #d1d5db', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Download size={12} /> CSV
                    </button>
                    <button
                      type="button"
                      data-testid={`email-po-${supplier.replace(/\W+/g, '_')}`}
                      onClick={() => openPoModal(supplier, items)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', background: '#d97706', color: '#fff',
                        border: 'none', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Mail size={12} /> Email PO
                    </button>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: '#92400e', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Item</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>SKU</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>On Hand</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Threshold</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Suggested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} style={{ borderTop: '1px solid #fef3c7' }}>
                        <td style={{ padding: '6px 8px', color: '#111827' }}>{it.name}</td>
                        <td style={{ padding: '6px 8px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>{it.sku || '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: it.quantity === 0 ? '#dc2626' : '#374151' }}>{it.quantity ?? 0}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', color: '#6b7280' }}>{it.low_stock_threshold ?? 0}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{suggestedQty(it)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {poModal && (
        <div className="modal-overlay" onClick={() => setPoModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="po-modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={20} color="#d97706" />
                Email PO to {poModal.supplier}
              </h2>
              <button className="btn-close" onClick={() => setPoModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {poMsg.text && (
                <div style={{
                  padding: '10px 12px', borderRadius: '8px', marginBottom: '12px',
                  backgroundColor: poMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: poMsg.type === 'success' ? '#065f46' : '#991b1b',
                }}>{poMsg.text}</div>
              )}
              <div className="form-group">
                <label>Supplier Email</label>
                <input
                  type="email"
                  data-testid="po-email-input"
                  value={poEmail}
                  onChange={(e) => setPoEmail(e.target.value)}
                  placeholder="supplier@example.com"
                />
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <textarea
                  data-testid="po-note-input"
                  rows={3}
                  value={poNote}
                  onChange={(e) => setPoNote(e.target.value)}
                  placeholder="e.g. Please confirm prices and estimated delivery."
                />
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>
                The email will include the {poModal.items.length} low-stock item{poModal.items.length === 1 ? '' : 's'} for <strong>{poModal.supplier}</strong> with suggested order quantities.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setPoModal(null)}>Cancel</button>
                <button
                  type="button"
                  data-testid="po-send-btn"
                  onClick={sendPO}
                  disabled={poSending}
                  style={{
                    padding: '10px 18px', background: '#d97706', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 600,
                    cursor: poSending ? 'not-allowed' : 'pointer', opacity: poSending ? 0.7 : 1,
                  }}
                >
                  {poSending ? 'Sending...' : 'Send PO Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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