import React from 'react';
import { Target } from 'lucide-react';

export const CouponPerformanceWidget = ({ couponPerf }) => {
  if (!couponPerf || couponPerf.length === 0) return null;

  return (
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
  );
};

export default CouponPerformanceWidget;
