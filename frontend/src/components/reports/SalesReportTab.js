import React from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export const SalesReportTab = ({ dailySales, weeklySales, monthlySales }) => (
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
);

export default SalesReportTab;
