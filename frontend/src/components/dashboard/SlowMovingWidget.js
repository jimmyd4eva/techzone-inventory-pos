import React from 'react';
import { TrendingDown, Tag } from 'lucide-react';

export const SlowMovingWidget = ({ slowMoving }) => {
  if (!slowMoving || slowMoving.length === 0) return null;

  return (
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
  );
};

export default SlowMovingWidget;
