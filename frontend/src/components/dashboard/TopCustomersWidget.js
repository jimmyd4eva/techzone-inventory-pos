import React from 'react';
import { Crown, Ticket } from 'lucide-react';

export const TopCustomersWidget = ({ topCustomers, onCreateCoupon }) => (
  <div
    className="card"
    data-testid="top-customers-card"
    style={{ marginBottom: '24px' }}
  >
    <div
      className="card-header"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
        <Crown size={20} color="#f59e0b" />
        Top Customers
      </h2>
      <span style={{ fontSize: '12px', color: '#6b7280' }}>
        by total spend • click 🎫 to generate a personalized coupon
      </span>
    </div>
    <div className="card-body" style={{ padding: 0 }}>
      {topCustomers.length === 0 ? (
        <p style={{ padding: '20px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
          No customer sales yet — top customers will appear here after your first completed sales.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>#</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Contact</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Orders</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Total Spent</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c) => {
                const rankColor = c.rank === 1 ? '#f59e0b' : c.rank === 2 ? '#94a3b8' : c.rank === 3 ? '#b45309' : '#9ca3af';
                return (
                  <tr
                    key={c.customer_id}
                    data-testid={`top-customer-row-${c.customer_id}`}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: rankColor,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}>{c.rank}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{c.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {c.phone || '—'}
                      {c.email ? <div style={{ fontSize: '11px' }}>{c.email}</div> : null}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', textAlign: 'right' }}>{c.sales_count}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#059669', textAlign: 'right' }}>
                      ${c.total_spent.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        data-testid={`top-customer-coupon-${c.customer_id}`}
                        onClick={() => onCreateCoupon(c.customer_id)}
                        title="Generate personalized coupon"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Ticket size={12} />
                        Coupon
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

export default TopCustomersWidget;
