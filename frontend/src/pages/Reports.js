import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Package, Receipt, Ticket } from 'lucide-react';
import { SalesReportTab } from '../components/reports/SalesReportTab';
import { TaxReportTab } from '../components/reports/TaxReportTab';
import { InventoryReportTab } from '../components/reports/InventoryReportTab';
import { CouponsReportTab } from '../components/reports/CouponsReportTab';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;


const TABS = [
  { id: 'sales', label: 'Sales Reports', Icon: TrendingUp, testid: 'tab-sales' },
  { id: 'tax', label: 'Tax Reports', Icon: Receipt, testid: 'tab-tax' },
  { id: 'inventory', label: 'Inventory', Icon: Package, testid: 'tab-inventory' },
  { id: 'coupons', label: 'Coupons', Icon: Ticket, testid: 'tab-coupons' },
];

const TabButton = ({ tab, active, onClick }) => (
  <button
    data-testid={tab.testid}
    onClick={onClick}
    style={{
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: active ? '#8b5cf6' : '#f3f4f6',
      color: active ? '#fff' : '#374151',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    }}
  >
    <tab.Icon size={18} />
    {tab.label}
  </button>
);

const Reports = () => {
  const [dailySales, setDailySales] = useState({ date: '', total_sales: 0, total_transactions: 0 });
  const [weeklySales, setWeeklySales] = useState({ week_start: '', week_end: '', total_sales: 0, total_transactions: 0 });
  const [monthlySales, setMonthlySales] = useState({ month: '', total_sales: 0, total_transactions: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [taxReport, setTaxReport] = useState(null);
  const [couponAnalytics, setCouponAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [salesR, weeklyR, monthlyR, lowStockR, taxR, couponR] = await Promise.all([
          axios.get(`${API}/reports/daily-sales`),
          axios.get(`${API}/reports/weekly-sales`),
          axios.get(`${API}/reports/monthly-sales`),
          axios.get(`${API}/inventory/low-stock`),
          axios.get(`${API}/reports/tax-summary`),
          axios.get(`${API}/reports/coupon-analytics`),
        ]);
        setDailySales(salesR.data);
        setWeeklySales(weeklyR.data);
        setMonthlySales(monthlyR.data);
        setLowStockItems(lowStockR.data);
        setTaxReport(taxR.data);
        setCouponAnalytics(couponR.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadTaxReport = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API}/reports/tax-summary/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.setAttribute('download', `tax_report_${today}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <div data-testid="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>View sales, inventory, and tax insights</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <TabButton key={t.id} tab={t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {activeTab === 'sales' && (
        <SalesReportTab dailySales={dailySales} weeklySales={weeklySales} monthlySales={monthlySales} />
      )}
      {activeTab === 'tax' && (
        <TaxReportTab taxReport={taxReport} downloadTaxReport={downloadTaxReport} downloading={downloading} />
      )}
      {activeTab === 'inventory' && (
        <InventoryReportTab lowStockItems={lowStockItems} />
      )}
      {activeTab === 'coupons' && (
        <CouponsReportTab couponAnalytics={couponAnalytics} />
      )}
    </div>
  );
};

export default Reports;
