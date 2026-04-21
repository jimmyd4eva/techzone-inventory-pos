import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Package, Wrench, Users, Crown, Ticket, AlertTriangle, PackageX, Mail, Download, MessageCircle, TrendingDown, Tag, Target, Award } from 'lucide-react';

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
  const [slowMoving, setSlowMoving] = useState([]);
  const [couponPerf, setCouponPerf] = useState([]);
  const [staffPerf, setStaffPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  // Purchase order modal
  const [poModal, setPoModal] = useState(null); // { supplier, items }
  const [poEmail, setPoEmail] = useState('');
  const [poNote, setPoNote] = useState('');
  const [poSending, setPoSending] = useState(false);
  const [poMsg, setPoMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    Promise.all([fetchStats(), fetchTopCustomers(), fetchLostCustomers(), fetchLowStock(), fetchSlowMoving(), fetchCouponPerf(), fetchStaffPerf()])
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

  const fetchSlowMoving = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/slow-moving-inventory?days=90&limit=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlowMoving(response.data || []);
    } catch (error) {
      console.error('Error fetching slow-moving inventory:', error);
    }
  };

  const fetchCouponPerf = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/coupon-performance?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCouponPerf(response.data || []);
    } catch (error) {
      console.error('Error fetching coupon performance:', error);
    }
  };

  const fetchStaffPerf = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/staff-performance?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffPerf(response.data || []);
    } catch (error) {
      // silent for non-admin/manager
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

  const openPoModal = async (supplier, items) => {
    setPoModal({ supplier, items });
    setPoEmail('');
    setPoNote('');
    setPoMsg({ type: '', text: '' });
    // Try to auto-fill from supplier directory
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(
        `${API}/suppliers/lookup?name=${encodeURIComponent(supplier)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.data) {
        if (r.data.email) setPoEmail(r.data.email);
        setPoModal({ supplier, items, directory: r.data });
      }
    } catch (e) {
      // silent; modal still works with manual entry
    }
  };

  const normalizeToE164 = (raw) => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (raw.trim().startsWith('+')) return '+' + digits;
    if (digits.length === 10 && digits.startsWith('876')) return '+1' + digits;
    if (digits.length === 7) return '+1876' + digits;
    if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
    if (digits.length === 10) return '+1' + digits;
    return '+' + digits;
  };

  const buildPoWhatsappMessage = (supplier, items, note) => {
    const lines = [
      `Hi ${supplier}, we'd like to reorder the following items:`,
      '',
      ...items.map((it) => `- ${it.name} (SKU ${it.sku || '-'}): suggested qty ${suggestedQty(it)} (on hand ${it.quantity}, threshold ${it.low_stock_threshold})`),
    ];
    if (note) {
      lines.push('');
      lines.push(`Note: ${note}`);
    }
    lines.push('');
    lines.push('Please confirm availability and pricing. Thank you!');
    return lines.join('\n');
  };

  const sharePoWhatsApp = () => {
    if (!poModal) return;
    const target = poModal.directory?.whatsapp_number || poModal.directory?.phone;
    if (!target) {
      setPoMsg({ type: 'error', text: 'No WhatsApp/phone number saved for this supplier. Add one in the Suppliers page.' });
      return;
    }
    const phone = normalizeToE164(target).replace(/\D/g, '');
    if (!phone) {
      setPoMsg({ type: 'error', text: 'Invalid WhatsApp number for this supplier.' });
      return;
    }
    const text = encodeURIComponent(buildPoWhatsappMessage(poModal.supplier, poModal.items, poNote));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
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

      {staffPerf.length > 0 && (
        <div
          className="card"
          data-testid="staff-performance-card"
          style={{ marginBottom: '24px', border: '1px solid #bbf7d0' }}
        >
          <div
            className="card-header"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f0fdf4',
              borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit',
              flexWrap: 'wrap', gap: '8px',
            }}
          >
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#166534' }}>
              <Award size={20} color="#16a34a" />
              Staff Performance
              <span
                data-testid="staff-perf-count"
                style={{
                  padding: '2px 10px', background: '#16a34a', color: '#fff',
                  borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                }}
              >{staffPerf.length}</span>
            </h2>
            <span style={{ fontSize: '12px', color: '#166534' }}>
              Last 30 days • shift variance = avg $ over/short on register close
            </span>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #bbf7d0' }}>
                  {['#', 'Staff', 'Role', 'Sales', 'Revenue', 'Avg Order', 'Shifts', 'Avg Variance'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffPerf.map((s, idx) => {
                  const rank = idx + 1;
                  const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#9ca3af';
                  const variance = s.avg_shift_variance || 0;
                  const varianceColor =
                    s.shifts_closed === 0
                      ? '#9ca3af'
                      : Math.abs(variance) <= 5
                        ? '#059669'
                        : Math.abs(variance) <= 20
                          ? '#d97706'
                          : '#dc2626';
                  return (
                    <tr
                      key={s.username}
                      data-testid={`staff-perf-row-${s.username.replace(/\W+/g, '_')}`}
                      style={{ borderBottom: '1px solid #dcfce7' }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: rankColor, color: '#fff', fontSize: '12px', fontWeight: 700,
                        }}>{rank}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{s.username}</div>
                        {s.email ? <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.email}</div> : null}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                          borderRadius: '4px',
                          background: s.role === 'admin' ? '#ede9fe' : s.role === 'manager' ? '#dbeafe' : '#f3f4f6',
                          color: s.role === 'admin' ? '#6b21a8' : s.role === 'manager' ? '#1e40af' : '#374151',
                          textTransform: 'capitalize',
                        }}>{s.role}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', textAlign: 'right', fontWeight: 600 }}>{s.sales_count}</td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#059669', fontWeight: 600, textAlign: 'right' }}>
                        ${s.total_revenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>
                        ${s.avg_order_value.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280', textAlign: 'right' }}>{s.shifts_closed}</td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700, textAlign: 'right', color: varianceColor }}>
                        {s.shifts_closed === 0 ? '—' : `$${variance.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {couponPerf.length > 0 && (
        <div
          className="card"
          data-testid="coupon-performance-card"
          style={{ marginBottom: '24px', border: '1px solid #c4b5fd' }}
        >
          <div
            className="card-header"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f5f3ff',
              borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit',
              flexWrap: 'wrap', gap: '8px',
            }}
          >
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#5b21b6' }}>
              <Target size={20} color="#7c3aed" />
              Coupon Performance
              <span
                data-testid="coupon-perf-count"
                style={{
                  padding: '2px 10px', background: '#7c3aed', color: '#fff',
                  borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                }}
              >{couponPerf.length}</span>
            </h2>
            <span style={{ fontSize: '12px', color: '#5b21b6' }}>
              ROI = revenue generated per $1 of discount given
            </span>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #c4b5fd' }}>
                  {['Code', 'Type', 'Redemptions', 'Discount Given', 'Revenue', 'Avg Order', 'ROI', 'Status'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#5b21b6', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {couponPerf.map((c) => {
                  const redemptions = c.redemptions || 0;
                  const roiValue = c.roi;
                  const roiColor =
                    roiValue === null || roiValue === undefined
                      ? '#9ca3af'
                      : roiValue >= 10
                        ? '#059669'
                        : roiValue >= 3
                          ? '#d97706'
                          : '#dc2626';
                  const roiLabel =
                    roiValue === null || roiValue === undefined
                      ? '—'
                      : `${roiValue.toFixed(1)}×`;
                  return (
                    <tr
                      key={c.id || c.code}
                      data-testid={`coupon-perf-row-${c.code}`}
                      style={{ borderBottom: '1px solid #ede9fe', opacity: c.is_active === false ? 0.55 : 1 }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>{c.code}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {c.description || '—'}
                          {c.customer_id ? ` · for ${c.customer_name || 'customer'}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151' }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${Number(c.discount_value || 0).toFixed(2)}`}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#111827', textAlign: 'right', fontWeight: 600 }}>
                        {redemptions}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#dc2626', textAlign: 'right' }}>
                        ${c.total_discount_given.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#059669', fontWeight: 600, textAlign: 'right' }}>
                        ${c.total_revenue.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>
                        ${c.avg_order_value.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 700, color: roiColor, textAlign: 'right' }}>
                        {roiLabel}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {c.is_active === false ? (
                          <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', background: '#e5e7eb', color: '#374151' }}>Inactive</span>
                        ) : redemptions === 0 ? (
                          <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>Unused</span>
                        ) : (
                          <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', background: '#d1fae5', color: '#065f46' }}>Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {slowMoving.length > 0 && (
        <div
          className="card"
          data-testid="slow-moving-card"
          style={{ marginBottom: '24px', border: '1px solid #bfdbfe' }}
        >
          <div
            className="card-header"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#eff6ff',
              borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit',
              flexWrap: 'wrap', gap: '8px',
            }}
          >
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#1d4ed8' }}>
              <TrendingDown size={20} color="#2563eb" />
              Slow-Moving Inventory
              <span
                data-testid="slow-moving-count"
                style={{
                  padding: '2px 10px', background: '#2563eb', color: '#fff',
                  borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                }}
              >{slowMoving.length}</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#1e40af' }}>
                In stock, no sale in 90+ days • proactively discount to free up cash
              </span>
              <button
                type="button"
                data-testid="slow-moving-flash-sale-btn"
                onClick={() => { window.location.href = '/coupons?preset=flash'; }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Tag size={12} /> Create Flash Sale Coupon
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #bfdbfe' }}>
                  {['Item', 'SKU', 'Supplier', 'In Stock', 'Stock Value', 'Days Stale', 'Status'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slowMoving.map((it) => {
                  const days = it.days_stale ?? 0;
                  const daysColor = days >= 180 ? '#7f1d1d' : days >= 120 ? '#b91c1c' : '#2563eb';
                  return (
                    <tr
                      key={it.id}
                      data-testid={`slow-moving-row-${it.id}`}
                      style={{ borderBottom: '1px solid #dbeafe' }}
                    >
                      <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{it.name}</td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>{it.sku || '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280' }}>{it.supplier || '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>{it.quantity}</td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#059669', textAlign: 'right' }}>
                        ${it.stock_value.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700, color: daysColor, textAlign: 'right' }}>
                        {days} days
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            background: it.ever_sold ? '#fef3c7' : '#fee2e2',
                            color: it.ever_sold ? '#92400e' : '#991b1b',
                          }}
                        >
                          {it.ever_sold ? 'Stalled' : 'Never sold'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                {poModal.directory && (
                  <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                    ✓ Auto-filled from supplier directory
                  </p>
                )}
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" className="btn-secondary" onClick={() => setPoModal(null)}>Cancel</button>
                <button
                  type="button"
                  data-testid="po-whatsapp-btn"
                  onClick={sharePoWhatsApp}
                  disabled={!poModal.directory?.whatsapp_number && !poModal.directory?.phone}
                  title={
                    (poModal.directory?.whatsapp_number || poModal.directory?.phone)
                      ? 'Open WhatsApp with PO pre-filled'
                      : 'No WhatsApp/phone saved for this supplier'
                  }
                  style={{
                    padding: '10px 14px', background: '#22c55e', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 600,
                    cursor: (poModal.directory?.whatsapp_number || poModal.directory?.phone) ? 'pointer' : 'not-allowed',
                    opacity: (poModal.directory?.whatsapp_number || poModal.directory?.phone) ? 1 : 0.45,
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
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