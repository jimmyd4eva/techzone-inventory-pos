import React from 'react';
import { AlertTriangle, Ticket } from 'lucide-react';

export const AtRiskCustomersWidget = ({ lostCustomers, onCreateCoupon }) => {
  if (!lostCustomers || lostCustomers.length === 0) return null;

  return (
    <div
      className="card"
      data-testid="lost-customers-card"
      style={{ marginBottom: '24px', border: '1px solid #fecaca' }}
    >
      <div
        className="card-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fef2f2',
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
        }}
      >
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#991b1b' }}>
          <AlertTriangle size={20} color="#dc2626" />
          At-Risk Customers
          <span
            data-testid="lost-customers-count"
            style={{
              padding: '2px 10px',
              background: '#dc2626',
              color: '#fff',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {lostCustomers.length}
          </span>
        </h2>
        <span style={{ fontSize: '12px', color: '#991b1b' }}>
          No purchase in 60+ days • click 🎫 for a pre-filled win-back coupon
        </span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fff', borderBottom: '1px solid #fecaca' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Contact</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Orders</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Total Spent</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Days Away</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lostCustomers.map((c) => {
                const days = c.days_since_last_sale ?? 0;
                const daysColor = days >= 180 ? '#7f1d1d' : days >= 90 ? '#b91c1c' : '#dc2626';
                return (
                  <tr
                    key={c.customer_id}
                    data-testid={`lost-customer-row-${c.customer_id}`}
                    style={{ borderBottom: '1px solid #fee2e2' }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{c.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {c.phone || '—'}
                      {c.email ? <div style={{ fontSize: '11px' }}>{c.email}</div> : null}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', textAlign: 'right' }}>{c.sales_count}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>
                      ${c.total_spent.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, textAlign: 'right', color: daysColor }}>
                      {days} days
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        data-testid={`lost-customer-coupon-${c.customer_id}`}
                        onClick={() => onCreateCoupon(c.customer_id, 'winback')}
                        title="Generate win-back coupon"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Ticket size={12} />
                        We Miss You
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AtRiskCustomersWidget;
