import React from 'react';
import { PackageX, Download, Mail } from 'lucide-react';

export const suggestedQty = (it) =>
  Math.max((it.low_stock_threshold || 10) * 3 - (it.quantity || 0), 5);

export const groupBySupplier = (items) => {
  const groups = {};
  items.forEach((it) => {
    const key = (it.supplier && String(it.supplier).trim()) || '— No supplier —';
    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  });
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
};

export const downloadGroupCSV = (supplier, items) => {
  const rows = [
    ['Name', 'SKU', 'Quantity', 'Low Stock Threshold', 'Suggested Order Qty', 'Supplier'].join(','),
    ...items.map((it) => [
      `"${(it.name || '').replace(/"/g, '""')}"`,
      `"${(it.sku || '').replace(/"/g, '""')}"`,
      it.quantity || 0,
      it.low_stock_threshold || 0,
      suggestedQty(it),
      `"${String(supplier).replace(/"/g, '""')}"`,
    ].join(',')),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PO_${supplier.replace(/[^\w]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const LowStockWidget = ({ lowStock, onOpenPoModal }) => {
  if (!lowStock || lowStock.length === 0) return null;

  const groups = groupBySupplier(lowStock);

  return (
    <div
      className="card"
      data-testid="low-stock-card"
      style={{ marginBottom: '24px', border: '1px solid #fcd34d' }}
    >
      <div
        className="card-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fffbeb',
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
        }}
      >
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#92400e' }}>
          <PackageX size={20} color="#d97706" />
          Low Stock — Reorder Needed
          <span
            data-testid="low-stock-count"
            style={{
              padding: '2px 10px', background: '#d97706', color: '#fff',
              borderRadius: '999px', fontSize: '12px', fontWeight: 700,
            }}
          >{lowStock.length}</span>
        </h2>
        <span style={{ fontSize: '12px', color: '#92400e' }}>
          Grouped by supplier • download CSV or email a purchase-order draft
        </span>
      </div>
      <div className="card-body" style={{ padding: '0' }}>
        {groups.map(([supplier, items]) => (
          <div
            key={supplier}
            data-testid={`low-stock-group-${supplier.replace(/\W+/g, '_')}`}
            style={{ borderBottom: '1px solid #fde68a', padding: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  {supplier}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {items.length} item{items.length === 1 ? '' : 's'} below threshold
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  data-testid={`download-po-${supplier.replace(/\W+/g, '_')}`}
                  onClick={() => downloadGroupCSV(supplier, items)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', background: '#f3f4f6', color: '#374151',
                    border: '1px solid #d1d5db', borderRadius: '6px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Download size={12} /> CSV
                </button>
                <button
                  type="button"
                  data-testid={`email-po-${supplier.replace(/\W+/g, '_')}`}
                  onClick={() => onOpenPoModal(supplier, items)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', background: '#d97706', color: '#fff',
                    border: 'none', borderRadius: '6px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Mail size={12} /> Email PO
                </button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: '#92400e', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Item</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>SKU</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>On Hand</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Threshold</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>Suggested</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderTop: '1px solid #fef3c7' }}>
                    <td style={{ padding: '6px 8px', color: '#111827' }}>{it.name}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>{it.sku || '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: it.quantity === 0 ? '#dc2626' : '#374151' }}>{it.quantity ?? 0}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#6b7280' }}>{it.low_stock_threshold ?? 0}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{suggestedQty(it)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowStockWidget;
