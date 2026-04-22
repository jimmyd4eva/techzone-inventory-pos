import React from 'react';
import { Receipt, BarChart3, PieChart, CheckCircle, XCircle, Download, Percent, Hash } from 'lucide-react';

export const TaxReportTab = ({ taxReport, downloadTaxReport, downloading }) => {
  if (!taxReport) return null;
  return (
    <>
  {/* Header with Download Button */}
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: '16px'
  }}>
    <div></div>
    <button
      data-testid="download-pdf-btn"
      onClick={downloadTaxReport}
      disabled={downloading}
      style={{
        padding: '10px 20px',
        backgroundColor: '#8b5cf6',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: downloading ? 'not-allowed' : 'pointer',
        opacity: downloading ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
      }}
    >
      <Download size={18} />
      {downloading ? 'Generating PDF...' : 'Export PDF'}
    </button>
  </div>

  {/* Tax Status Banner */}
  <div style={{
    padding: '16px 20px',
    borderRadius: '12px',
    backgroundColor: taxReport.tax_enabled ? '#d1fae5' : '#fef3c7',
    border: `1px solid ${taxReport.tax_enabled ? '#a7f3d0' : '#fcd34d'}`,
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }}>
    {taxReport.tax_enabled ? (
      <CheckCircle size={24} color="#059669" />
    ) : (
      <XCircle size={24} color="#d97706" />
    )}
    <div>
      <div style={{ fontWeight: '600', color: taxReport.tax_enabled ? '#065f46' : '#92400e' }}>
        Tax is {taxReport.tax_enabled ? 'Enabled' : 'Disabled'}
      </div>
      <div style={{ fontSize: '14px', color: taxReport.tax_enabled ? '#047857' : '#b45309' }}>
        {taxReport.tax_enabled 
          ? `Current rate: ${(taxReport.tax_rate * 100).toFixed(0)}% • Exempt categories: ${taxReport.exempt_categories.length > 0 ? taxReport.exempt_categories.join(', ') : 'None'}`
          : 'No tax is being collected on sales'}
      </div>
    </div>
  </div>

  {/* Tax Collection Stats */}
  <div className="stats-grid" data-testid="tax-stats">
    <div className="stat-card" data-testid="tax-daily">
      <div className="stat-card-header">
        <h3>Today's Tax</h3>
        <div className="stat-icon purple">
          <Receipt size={20} color="white" />
        </div>
      </div>
      <div className="stat-value" style={{ color: '#8b5cf6' }}>
        ${taxReport.daily.tax_collected.toFixed(2)}
      </div>
      <div className="stat-label">
        From ${taxReport.daily.total_sales.toFixed(2)} in sales ({taxReport.daily.transactions} transactions)
      </div>
    </div>

    <div className="stat-card" data-testid="tax-weekly">
      <div className="stat-card-header">
        <h3>Weekly Tax</h3>
        <div className="stat-icon blue">
          <BarChart3 size={20} color="white" />
        </div>
      </div>
      <div className="stat-value" style={{ color: '#3b82f6' }}>
        ${taxReport.weekly.tax_collected.toFixed(2)}
      </div>
      <div className="stat-label">
        From ${taxReport.weekly.total_sales.toFixed(2)} in sales ({taxReport.weekly.transactions} transactions)
      </div>
    </div>

    <div className="stat-card" data-testid="tax-monthly">
      <div className="stat-card-header">
        <h3>Monthly Tax</h3>
        <div className="stat-icon green">
          <PieChart size={20} color="white" />
        </div>
      </div>
      <div className="stat-value" style={{ color: '#10b981' }}>
        ${taxReport.monthly.tax_collected.toFixed(2)}
      </div>
      <div className="stat-label">
        {taxReport.monthly.month} ({taxReport.monthly.transactions} transactions)
      </div>
    </div>
  </div>

  {/* Taxable vs Exempt */}
  <div className="card" style={{ marginTop: '24px', marginBottom: '24px' }}>
    <div className="card-header">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PieChart size={20} />
        Taxable vs Exempt Sales (This Month)
      </h2>
    </div>
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#22c55e', 
              borderRadius: '50%', 
              marginRight: '12px' 
            }}></div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Taxable Sales</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }} data-testid="taxable-sales">
                ${taxReport.taxable_vs_exempt.taxable_sales.toFixed(2)}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#ef4444', 
              borderRadius: '50%', 
              marginRight: '12px' 
            }}></div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Exempt Sales</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }} data-testid="exempt-sales">
                ${taxReport.taxable_vs_exempt.exempt_sales.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Bar */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {(taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales) > 0 && (
            <>
              <div style={{ 
                height: '40px', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                display: 'flex',
                backgroundColor: '#e5e7eb'
              }}>
                <div style={{ 
                  width: `${(taxReport.taxable_vs_exempt.taxable_sales / (taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales)) * 100}%`,
                  backgroundColor: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {((taxReport.taxable_vs_exempt.taxable_sales / (taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales)) * 100).toFixed(0)}%
                </div>
                <div style={{ 
                  flex: 1,
                  backgroundColor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {((taxReport.taxable_vs_exempt.exempt_sales / (taxReport.taxable_vs_exempt.taxable_sales + taxReport.taxable_vs_exempt.exempt_sales)) * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                <span>Taxable</span>
                <span>Exempt</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* Category Breakdown */}
  {taxReport.category_breakdown && taxReport.category_breakdown.length > 0 && (
    <div className="card">
      <div className="card-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={20} />
          Sales by Category (This Month)
        </h2>
      </div>
      <div className="table-container">
        <table data-testid="category-breakdown-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Status</th>
              <th>Total Sales</th>
              <th>Tax Collected</th>
            </tr>
          </thead>
          <tbody>
            {taxReport.category_breakdown.map((cat) => (
              <tr key={cat.category} data-testid={`category-row-${cat.category}`}>
                <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{cat.category}</td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: cat.is_exempt ? '#fef2f2' : '#f0fdf4',
                    color: cat.is_exempt ? '#991b1b' : '#166534'
                  }}>
                    {cat.is_exempt ? 'EXEMPT' : 'TAXABLE'}
                  </span>
                </td>
                <td>${cat.sales.toFixed(2)}</td>
                <td style={{ color: cat.is_exempt ? '#9ca3af' : '#059669', fontWeight: '600' }}>
                  {cat.is_exempt ? '-' : `$${cat.tax_collected.toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9fafb', fontWeight: '700' }}>
              <td colSpan="2">Total</td>
              <td>${taxReport.category_breakdown.reduce((sum, c) => sum + c.sales, 0).toFixed(2)}</td>
              <td style={{ color: '#059669' }}>
                ${taxReport.category_breakdown.reduce((sum, c) => sum + c.tax_collected, 0).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )}
    </>
  );
};

export default TaxReportTab;
