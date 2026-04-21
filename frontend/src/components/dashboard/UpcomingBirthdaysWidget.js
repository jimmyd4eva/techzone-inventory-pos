import React from 'react';
import { Cake, Check } from 'lucide-react';

export const UpcomingBirthdaysWidget = ({ upcomingBirthdays }) => {
  if (!upcomingBirthdays || upcomingBirthdays.length === 0) return null;

  return (
    <div
      className="card"
      data-testid="upcoming-birthdays-card"
      style={{ marginBottom: '24px', border: '1px solid #fbcfe8' }}
    >
      <div
        className="card-header"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fdf2f8',
          borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit',
          flexWrap: 'wrap', gap: '8px',
        }}
      >
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#9d174d' }}>
          <Cake size={20} color="#ec4899" />
          Upcoming Birthdays
          <span
            data-testid="upcoming-birthdays-count"
            style={{
              padding: '2px 10px', background: '#ec4899', color: '#fff',
              borderRadius: '999px', fontSize: '12px', fontWeight: 700,
            }}
          >{upcomingBirthdays.length}</span>
        </h2>
        <span style={{ fontSize: '12px', color: '#9d174d' }}>
          Next 7 days • auto-coupon sends on the day • reach out personally for bonus delight
        </span>
      </div>
      <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff', borderBottom: '1px solid #fbcfe8' }}>
              {['Customer', 'Contact', 'Birthday', 'When', 'Total Spent', 'Coupon'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#9d174d', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upcomingBirthdays.map((c) => {
              const whenLabel =
                c.days_until === 0 ? 'Today 🎉' :
                c.days_until === 1 ? 'Tomorrow' :
                `In ${c.days_until} days`;
              const whenColor = c.days_until === 0 ? '#be185d' : c.days_until <= 2 ? '#db2777' : '#6b7280';
              return (
                <tr
                  key={c.customer_id}
                  data-testid={`upcoming-birthday-row-${c.customer_id}`}
                  style={{ borderBottom: '1px solid #fce7f3' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {c.phone || '—'}
                    {c.email ? <div style={{ fontSize: '11px' }}>{c.email}</div> : null}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{c.birthday}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: whenColor }}>
                    {whenLabel}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>
                    ${c.total_spent.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.coupon_already_sent ? (
                      <span
                        data-testid={`upcoming-birthday-sent-${c.customer_id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                          borderRadius: '4px', background: '#d1fae5', color: '#065f46',
                        }}
                      >
                        <Check size={11} /> Sent
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                          borderRadius: '4px', background: '#fce7f3', color: '#9d174d',
                        }}
                      >
                        Pending
                      </span>
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

export default UpcomingBirthdaysWidget;
