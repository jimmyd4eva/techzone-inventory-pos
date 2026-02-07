import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, Package, Calendar, Receipt, PieChart, BarChart3, CheckCircle, XCircle, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Reports = () => {
  const [dailySales, setDailySales] = useState({ date: '', total_sales: 0, total_transactions: 0 });
  const [weeklySales, setWeeklySales] = useState({ week_start: '', week_end: '', total_sales: 0, total_transactions: 0 });
  const [monthlySales, setMonthlySales] = useState({ month: '', total_sales: 0, total_transactions: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [taxReport, setTaxReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [salesResponse, weeklySalesResponse, monthlySalesResponse, lowStockResponse, taxResponse] = await Promise.all([
        axios.get(`${API}/reports/daily-sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/reports/weekly-sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/reports/monthly-sales`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/inventory/low-stock`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/reports/tax-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setDailySales(salesResponse.data);
      setWeeklySales(weeklySalesResponse.data);
      setMonthlySales(monthlySalesResponse.data);
      setLowStockItems(lowStockResponse.data);
      setTaxReport(taxResponse.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTaxReport = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/tax-summary/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
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

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '12px'
      }}>
        <button
          data-testid="tab-sales"
          onClick={() => setActiveTab('sales')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'sales' ? '#8b5cf6' : '#f3f4f6',
            color: activeTab === 'sales' ? '#fff' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={18} />
          Sales Reports
        </button>
        <button
          data-testid="tab-tax"
          onClick={() => setActiveTab('tax')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'tax' ? '#8b5cf6' : '#f3f4f6',
            color: activeTab === 'tax' ? '#fff' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Receipt size={18} />
          Tax Reports
        </button>
        <button
          data-testid="tab-inventory"
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'inventory' ? '#8b5cf6' : '#f3f4f6',
            color: activeTab === 'inventory' ? '#fff' : '#374151',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Package size={18} />
          Inventory
        </button>
      </div>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="stats-grid">
          <div className="stat-card" data-testid="report-daily-sales">
            <div className="stat-card-header">
              <h3>Daily Sales</h3>
              <div className="stat-icon purple">
                <DollarSign size={20} color="white" />
              </div>
            </div>
            <div className="stat-value" data-testid="daily-sales-value">
              ${dailySales.total_sales.toFixed(2)}
            </div>
            <div className="stat-label">
              {dailySales.total_transactions} transactions today
            </div>
          </div>

          <div className="stat-card" data-testid="report-weekly-sales">
            <div className="stat-card-header">
              <h3>Weekly Sales</h3>
              <div className="stat-icon blue">
                <TrendingUp size={20} color="white" />
              </div>
            </div>
            <div className="stat-value" data-testid="weekly-sales-value">
              ${weeklySales.total_sales.toFixed(2)}
            </div>
            <div className="stat-label">
              {weeklySales.total_transactions} transactions this week
            </div>
          </div>

          <div className="stat-card" data-testid="report-monthly-sales">
            <div className="stat-card-header">
              <h3>Monthly Sales</h3>
              <div className="stat-icon green">
                <Calendar size={20} color="white" />
              </div>
            </div>
            <div className="stat-value" data-testid="monthly-sales-value">
              ${monthlySales.total_sales.toFixed(2)}
            </div>
            <div className="stat-label">
              {monthlySales.total_transactions} transactions in {monthlySales.month || 'this month'}
            </div>
          </div>
        </div>
      )}

      {/* Tax Reports Tab */}
      {activeTab === 'tax' && taxReport && (
        <>
          {/* Tax Status Banner */}
          <div style={{
            padding: '16px 20px',
            borderRadius: '12px',
            backgroundColor: taxReport.tax_enabled ? '#d1fae5' : '#fef3c7',
            border: `1px solid ${taxReport.tax_enabled ? '#a7f3d0' : '#fcd34d'}`,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {taxReport.tax_enabled ? (
              <CheckCircle size={24} color="#059669" />
            ) : (
              <XCircle size={24} color="#d97706" />
            )}
            <div>
              <div style={{ fontWeight: '600', color: taxReport.tax_enabled ? '#065f46' : '#92400e' }}>
                Tax is {taxReport.tax_enabled ? 'Enabled' : 'Disabled'}
              </div>
              <div style={{ fontSize: '14px', color: taxReport.tax_enabled ? '#047857' : '#b45309' }}>
                {taxReport.tax_enabled 
                  ? `Current rate: ${(taxReport.tax_rate * 100).toFixed(0)}% • Exempt categories: ${taxReport.exempt_categories.length > 0 ? taxReport.exempt_categories.join(', ') : 'None'}`
                  : 'No tax is being collected on sales'}
              </div>
            </div>
          </div>

          {/* Tax Collection Stats */}
          <div className="stats-grid" data-testid="tax-stats">
            <div className="stat-card" data-testid="tax-daily">
              <div className="stat-card-header">
                <h3>Today's Tax</h3>
                <div className="stat-icon purple">
                  <Receipt size={20} color="white" />
                </div>
              </div>
              <div className="stat-value" style={{ color: '#8b5cf6' }}>
                ${taxReport.daily.tax_collected.toFixed(2)}
              </div>
              <div className="stat-label">
                From ${taxReport.daily.total_sales.toFixed(2)} in sales ({taxReport.daily.transactions} transactions)
              </div>
            </div>

            <div className="stat-card" data-testid="tax-weekly">
              <div className="stat-card-header">
                <h3>Weekly Tax</h3>
                <div className="stat-icon blue">
                  <BarChart3 size={20} color="white" />
                </div>
              </div>
              <div className="stat-value" style={{ color: '#3b82f6' }}>
                ${taxReport.weekly.tax_collected.toFixed(2)}
              </div>
              <div className="stat-label">
                From ${taxReport.weekly.total_sales.toFixed(2)} in sales ({taxReport.weekly.transactions} transactions)
              </div>
            </div>

            <div className="stat-card" data-testid="tax-monthly">
              <div className="stat-card-header">
                <h3>Monthly Tax</h3>
                <div className="stat-icon green">
                  <PieChart size={20} color="white" />
                </div>
              </div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                ${taxReport.monthly.tax_collected.toFixed(2)}
              </div>
              <div className="stat-label">
                {taxReport.monthly.month} ({taxReport.monthly.transactions} transactions)
              </div>
            </div>
          </div>

          {/* Taxable vs Exempt */}
          <div className="card" style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div className="card-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={20} />
                Taxable vs Exempt Sales (This Month)
              </h2>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#22c55e', 
                      borderRadius: '50%', 
                      marginRight: '12px' 
                    }}></div>
                    <div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Taxable Sales</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }} data-testid="taxable-sales">
                        ${taxReport.taxable_vs_exempt.taxable_sales.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: '#ef4444', 
                      borderRadius: '50%', 
                      marginRight: '12px' 
                    }}></div>
                    <div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Exempt Sales</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }} data-testid="exempt-sales">
                        ${taxReport.taxable_vs_exempt.exempt_sales.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Bar */}
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {(taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales) > 0 && (
                    <>
                      <div style={{ 
                        height: '40px', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        display: 'flex',
                        backgroundColor: '#e5e7eb'
                      }}>
                        <div style={{ 
                          width: `${(taxReport.taxable_vs_exempt.taxable_sales / (taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales)) * 100}%`,
                          backgroundColor: '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {((taxReport.taxable_vs_exempt.taxable_sales / (taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales)) * 100).toFixed(0)}%
                        </div>
                        <div style={{ 
                          flex: 1,
                          backgroundColor: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {((taxReport.taxable_vs_exempt.exempt_sales / (taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales)) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                        <span>Taxable</span>
                        <span>Exempt</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {taxReport.category_breakdown && taxReport.category_breakdown.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} />
                  Sales by Category (This Month)
                </h2>
              </div>
              <div className="table-container">
                <table data-testid="category-breakdown-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Total Sales</th>
                      <th>Tax Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxReport.category_breakdown.map((cat, idx) => (
                      <tr key={idx} data-testid={`category-row-${cat.category}`}>
                        <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{cat.category}</td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: cat.is_exempt ? '#fef2f2' : '#f0fdf4',
                            color: cat.is_exempt ? '#991b1b' : '#166534'
                          }}>
                            {cat.is_exempt ? 'EXEMPT' : 'TAXABLE'}
                          </span>
                        </td>
                        <td>${cat.sales.toFixed(2)}</td>
                        <td style={{ color: cat.is_exempt ? '#9ca3af' : '#059669', fontWeight: '600' }}>
                          {cat.is_exempt ? '-' : `$${cat.tax_collected.toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f9fafb', fontWeight: '700' }}>
                      <td colSpan="2">Total</td>
                      <td>${taxReport.category_breakdown.reduce((sum, c) => sum + c.sales, 0).toFixed(2)}</td>
                      <td style={{ color: '#059669' }}>
                        ${taxReport.category_breakdown.reduce((sum, c) => sum + c.tax_collected, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          <div className="stats-grid">
            <div className="stat-card" data-testid="report-low-stock-count">
              <div className="stat-card-header">
                <h3>Low Stock Alert</h3>
                <div className="stat-icon orange">
                  <Package size={20} color="white" />
                </div>
              </div>
              <div className="stat-value" data-testid="low-stock-count-value">
                {lowStockItems.length}
              </div>
              <div className="stat-label">Items need reordering</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h2>Low Stock Items</h2>
            </div>
            <div className="table-container">
              {lowStockItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <h3>All items are well stocked</h3>
                  <p>No items below low stock threshold</p>
                </div>
              ) : (
                <table data-testid="low-stock-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>SKU</th>
                      <th>Current Stock</th>
                      <th>Threshold</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr key={item.id} data-testid={`low-stock-item-${item.id}`}>
                        <td>{item.name}</td>
                        <td><span className="badge">{item.type}</span></td>
                        <td>{item.sku}</td>
                        <td style={{ color: '#ef4444', fontWeight: '600' }}>{item.quantity}</td>
                        <td>{item.low_stock_threshold}</td>
                        <td>{item.supplier || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
