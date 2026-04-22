import React from 'react';
import { Package } from 'lucide-react';

export const InventoryReportTab = ({ lowStockItems }) => (
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
);

export default InventoryReportTab;
