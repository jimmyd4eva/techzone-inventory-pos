import React from 'react';
import { Ticket, Percent, Hash, TrendingUp } from 'lucide-react';

export const CouponsReportTab = ({ couponAnalytics }) => {
  if (!couponAnalytics) return null;
  return (
    <>
  {/* Summary Stats */}
  <div className="stats-grid" data-testid="coupon-stats">
    <div className="stat-card">
      <div className="stat-card-header">
        <h3>Total Coupons</h3>
        <div className="stat-icon purple">
          <Ticket size={20} color="white" />
        </div>
      </div>
      <div className="stat-value" style={{ color: '#8b5cf6' }}>
        {couponAnalytics.summary.total_coupons}
      </div>
      <div className="stat-label">
        {couponAnalytics.summary.active_coupons} active
      </div>
    </div>

    <div className="stat-card">
      <div className="stat-card-header">
        <h3>Coupon Usage Rate</h3>
        <div className="stat-icon blue">
          <Percent size={20} color="white" />
        </div>
      </div>
      <div className="stat-value" style={{ color: '#3b82f6' }}>
        {couponAnalytics.summary.coupon_usage_rate}%
      </div>
      <div className="stat-label">
        {couponAnalytics.summary.sales_with_coupons} of {couponAnalytics.summary.total_sales_this_month} sales
      </div>
    </div>

    <div className="stat-card">
      <div className="stat-card-header">
        <h3>Total Discounts Given</h3>
        <div className="stat-icon orange">
          <DollarSign size={20} color="white" />
        </div>
      </div>
      <div className="stat-value" style={{ color: '#f97316' }}>
        ${couponAnalytics.summary.total_discount_given.toFixed(2)}
      </div>
      <div className="stat-label">
        Avg ${couponAnalytics.summary.avg_discount_per_sale.toFixed(2)} per sale
      </div>
    </div>

    <div className="stat-card">
      <div className="stat-card-header">
        <h3>Revenue with Coupons</h3>
        <div className="stat-icon green">
          <TrendingUp size={20} color="white" />
        </div>
      </div>
      <div className="stat-value" style={{ color: '#10b981' }}>
        ${couponAnalytics.summary.total_revenue_with_coupons.toFixed(2)}
      </div>
      <div className="stat-label">
        {couponAnalytics.summary.month}
      </div>
    </div>
  </div>

  {/* Popular Coupons */}
  {couponAnalytics.coupon_breakdown && couponAnalytics.coupon_breakdown.length > 0 && (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="card-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={20} />
          Most Popular Coupons (This Month)
        </h2>
      </div>
      <div className="table-container">
        <table data-testid="coupon-breakdown-table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Discount</th>
              <th>Times Used</th>
              <th>Total Discount Given</th>
              <th>Revenue Generated</th>
              <th>Avg Order Value</th>
            </tr>
          </thead>
          <tbody>
            {couponAnalytics.coupon_breakdown.map((coupon) => (
              <tr key={coupon.code} data-testid={`coupon-row-${coupon.code}`}>
                <td>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: '700',
                    backgroundColor: '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {coupon.code}
                  </span>
                </td>
                <td>
                  <span style={{ color: '#059669', fontWeight: '600' }}>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={14} color="#6b7280" />
                    {coupon.usage_count}
                  </span>
                </td>
                <td style={{ color: '#f97316', fontWeight: '600' }}>
                  ${coupon.total_discount.toFixed(2)}
                </td>
                <td style={{ color: '#10b981', fontWeight: '600' }}>
                  ${coupon.total_revenue.toFixed(2)}
                </td>
                <td>${coupon.avg_order_value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* All Coupons Status */}
  <div className="card" style={{ marginTop: '24px' }}>
    <div className="card-header">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Ticket size={20} />
        All Coupons Status
      </h2>
    </div>
    <div className="table-container">
      {couponAnalytics.all_coupons_status.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h3>No Coupons Yet</h3>
          <p>Create coupons to start tracking analytics</p>
        </div>
      ) : (
        <table data-testid="all-coupons-status-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Discount</th>
              <th>Usage</th>
              <th>Utilization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {couponAnalytics.all_coupons_status.map((coupon) => (
              <tr key={coupon.code}>
                <td>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: '700',
                    backgroundColor: '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {coupon.code}
                  </span>
                </td>
                <td>{coupon.description || '-'}</td>
                <td>
                  <span style={{ color: '#059669', fontWeight: '600' }}>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                  </span>
                </td>
                <td>
                  {coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                </td>
                <td>
                  {coupon.utilization !== null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '60px',
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(coupon.utilization, 100)}%`,
                          height: '100%',
                          backgroundColor: coupon.utilization >= 90 ? '#ef4444' : coupon.utilization >= 70 ? '#f97316' : '#22c55e',
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{coupon.utilization}%</span>
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>Unlimited</span>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: coupon.is_active ? '#d1fae5' : '#fee2e2',
                    color: coupon.is_active ? '#065f46' : '#991b1b'
                  }}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
    </>
  );
};

export default CouponsReportTab;
