import React from 'react';
import { Award } from 'lucide-react';

export const StaffPerformanceWidget = ({ staffPerf }) => {
  if (!staffPerf || staffPerf.length === 0) return null;

  return (
    <div
      className="card"
      data-testid="staff-performance-card"
      style={{ marginBottom: '24px', border: '1px solid #bbf7d0' }}
    >
      <div
        className="card-header"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f0fdf4',
          borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit',
          flexWrap: 'wrap', gap: '8px',
        }}
      >
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#166534' }}>
          <Award size={20} color="#16a34a" />
          Staff Performance
          <span
            data-testid="staff-perf-count"
            style={{
              padding: '2px 10px', background: '#16a34a', color: '#fff',
              borderRadius: '999px', fontSize: '12px', fontWeight: 700,
            }}
          >{staffPerf.length}</span>
        </h2>
        <span style={{ fontSize: '12px', color: '#166534' }}>
          Last 30 days • shift variance = avg $ over/short on register close
        </span>
      </div>
      <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fff', borderBottom: '1px solid #bbf7d0' }}>
              {['#', 'Staff', 'Role', 'Sales', 'Revenue', 'Avg Order', 'Shifts', 'Avg Variance'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffPerf.map((s, idx) => {
              const rank = idx + 1;
              const rankColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#9ca3af';
              const variance = s.avg_shift_variance || 0;
              const varianceColor =
                s.shifts_closed === 0
                  ? '#9ca3af'
                  : Math.abs(variance) <= 5
                    ? '#059669'
                    : Math.abs(variance) <= 20
                      ? '#d97706'
                      : '#dc2626';
              return (
                <tr
                  key={s.username}
                  data-testid={`staff-perf-row-${s.username.replace(/\W+/g, '_')}`}
                  style={{ borderBottom: '1px solid #dcfce7' }}
                >
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: rankColor, color: '#fff', fontSize: '12px', fontWeight: 700,
                    }}>{rank}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{s.username}</div>
                    {s.email ? <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.email}</div> : null}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      padding: '2px 8px', fontSize: '11px', fontWeight: 600,
                      borderRadius: '4px',
                      background: s.role === 'admin' ? '#ede9fe' : s.role === 'manager' ? '#dbeafe' : '#f3f4f6',
                      color: s.role === 'admin' ? '#6b21a8' : s.role === 'manager' ? '#1e40af' : '#374151',
                      textTransform: 'capitalize',
                    }}>{s.role}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', textAlign: 'right', fontWeight: 600 }}>{s.sales_count}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#059669', fontWeight: 600, textAlign: 'right' }}>
                    ${s.total_revenue.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>
                    ${s.avg_order_value.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280', textAlign: 'right' }}>{s.shifts_closed}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 700, textAlign: 'right', color: varianceColor }}>
                    {s.shifts_closed === 0 ? '—' : `$${variance.toFixed(2)}`}
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

export default StaffPerformanceWidget;
