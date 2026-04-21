import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Wrench } from 'lucide-react';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { StaffPerformanceWidget } from '../components/dashboard/StaffPerformanceWidget';
import { TopCustomersWidget } from '../components/dashboard/TopCustomersWidget';
import { AtRiskCustomersWidget } from '../components/dashboard/AtRiskCustomersWidget';
import { CouponPerformanceWidget } from '../components/dashboard/CouponPerformanceWidget';
import { SlowMovingWidget } from '../components/dashboard/SlowMovingWidget';
import { LowStockWidget } from '../components/dashboard/LowStockWidget';
import { PurchaseOrderModal } from '../components/dashboard/PurchaseOrderModal';
import { UpcomingBirthdaysWidget } from '../components/dashboard/UpcomingBirthdaysWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

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
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [businessName, setBusinessName] = useState('TECHZONE');
  const [loading, setLoading] = useState(true);
  const [poModal, setPoModal] = useState(null);

  useEffect(() => {
    const safe = (url, setter, opts = {}) =>
      axios
        .get(`${API}${url}`, { headers: authHeader() })
        .then((r) => setter(opts.mapper ? opts.mapper(r.data) : r.data || (opts.defaultValue ?? [])))
        .catch((e) => {
          if (!opts.silent) console.error(`Error fetching ${url}:`, e);
        });

    Promise.all([
      safe('/reports/dashboard-stats', setStats, { mapper: (d) => d || {} }),
      safe('/reports/top-customers?limit=10', setTopCustomers),
      safe('/reports/lost-customers?days=60&limit=20', setLostCustomers),
      safe('/inventory/low-stock', setLowStock),
      safe('/reports/slow-moving-inventory?days=90&limit=15', setSlowMoving),
      safe('/reports/coupon-performance?limit=20', setCouponPerf),
      safe('/reports/staff-performance?days=30', setStaffPerf, { silent: true }),
      safe('/reports/upcoming-birthdays?days=7', setUpcomingBirthdays),
      axios.get(`${API}/settings/public`).then((r) => {
        const raw = r.data?.business_name || '';
        // business_name may contain rich-text HTML — strip to plain text for message bodies
        const plain = raw.replace(/<[^>]+>/g, '').trim();
        if (plain) setBusinessName(plain);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
    // Intentional mount-once effect: API, axios, authHeader and setters are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goCreateCoupon = (customerId, preset) => {
    const qs = new URLSearchParams({ coupon_for: customerId });
    if (preset) qs.set('preset', preset);
    window.location.href = `/customers?${qs.toString()}`;
  };

  const openPoModal = async (supplier, items) => {
    setPoModal({ supplier, items });
    try {
      const r = await axios.get(
        `${API}/suppliers/lookup?name=${encodeURIComponent(supplier)}`,
        { headers: authHeader() }
      );
      if (r.data) {
        setPoModal({ supplier, items, directory: r.data });
      }
    } catch (err) {
      // Non-fatal: supplier lookup failed; modal still works with manual entry.
      console.debug('Supplier directory lookup failed, falling back to manual entry:', err?.message);
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

      <StatsGrid stats={stats} />
      <StaffPerformanceWidget staffPerf={staffPerf} />
      <UpcomingBirthdaysWidget upcomingBirthdays={upcomingBirthdays} businessName={businessName} />
      <TopCustomersWidget topCustomers={topCustomers} onCreateCoupon={goCreateCoupon} />
      <AtRiskCustomersWidget lostCustomers={lostCustomers} onCreateCoupon={goCreateCoupon} />
      <CouponPerformanceWidget couponPerf={couponPerf} />
      <SlowMovingWidget slowMoving={slowMoving} />
      <LowStockWidget lowStock={lowStock} onOpenPoModal={openPoModal} />
      <PurchaseOrderModal poModal={poModal} setPoModal={setPoModal} />

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

