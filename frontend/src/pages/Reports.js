import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingUp, Package, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Reports = () => {
  const [dailySales, setDailySales] = useState({ date: '', total_sales: 0, total_transactions: 0 });
  const [weeklySales, setWeeklySales] = useState({ week_start: '', week_end: '', total_sales: 0, total_transactions: 0 });
  const [monthlySales, setMonthlySales] = useState({ month: '', total_sales: 0, total_transactions: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [salesResponse, weeklySalesResponse, monthlySalesResponse, lowStockResponse] = await Promise.all([
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
        })
      ]);

      setDailySales(salesResponse.data);
      setWeeklySales(weeklySalesResponse.data);
      setMonthlySales(monthlySalesResponse.data);
      setLowStockItems(lowStockResponse.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <div data-testid="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>View sales and inventory insights</p>
      </div>

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

      <div className="card">
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
    </div>
  );
};

export default Reports;