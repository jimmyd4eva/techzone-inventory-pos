import React from 'react';
import { DollarSign, Package, Users, Wrench } from 'lucide-react';

export const StatsGrid = ({ stats }) => (
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
);

export default StatsGrid;
