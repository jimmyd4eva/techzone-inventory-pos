import React from 'react';
import './Receipt.css';

const Receipt = ({ sale, onClose, businessSettings }) => {
  // Use business settings or defaults
  const businessName = businessSettings?.business_name || 'TECHZONE';
  const businessAddress = businessSettings?.business_address || '30 Giltress Street, Kingston 2, JA';
  const businessPhone = businessSettings?.business_phone || '876-633-9251';
  const businessLogo = businessSettings?.business_logo || '/techzone-logo.jpg';
  const taxRate = businessSettings?.tax_rate || 0.10;
  
  const handlePrint = () => {
    try {
      console.log('🖨️ Print button clicked - calling window.print()');
      
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        console.log('Executing window.print()...');
        window.print();
        console.log('window.print() executed successfully');
      }, 100);
    } catch (error) {
      console.error('Error calling window.print():', error);
      alert(`Print error: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Split business name for colored display (first half blue, second half red)
  const nameParts = businessName.split('');
  const midPoint = Math.ceil(nameParts.length / 2);
  const firstPart = nameParts.slice(0, midPoint).join('');
  const secondPart = nameParts.slice(midPoint).join('');

  return (
    <div className="receipt-overlay">
      <div className="receipt-modal">
        <div className="receipt-actions no-print">
          <button className="btn btn-success" onClick={handlePrint} data-testid="print-receipt-btn">
            🖨️ Print Receipt
          </button>
          <button className="btn btn-secondary" onClick={onClose} data-testid="close-receipt-btn">
            Close
          </button>
        </div>

        <div className="receipt-container" id="receipt-print">
          <div className="receipt-header">
            <div style={{ overflow: 'hidden', height: '95px', margin: '0 auto 12px', width: '230px' }}>
              <img 
                src={businessLogo} 
                alt={`${businessName} Logo`}
                style={{ width: '230px', height: 'auto', display: 'block' }}
                onError={(e) => { e.target.src = '/techzone-logo.jpg'; }}
              />
            </div>
            <h1 className="receipt-title">
              <span className="text-blue">{firstPart}</span>
              <span className="text-red">{secondPart}</span>
            </h1>
            <p className="receipt-address">{businessAddress}</p>
            <p className="receipt-contact">{businessPhone}</p>
            <div className="receipt-divider"></div>
          </div>

          <div className="receipt-info">
            <div className="receipt-row">
              <span>Receipt #:</span>
              <span><strong>{sale.id.substring(0, 8).toUpperCase()}</strong></span>
            </div>
            <div className="receipt-row">
              <span>Date:</span>
              <span>{formatDate(sale.created_at)}</span>
            </div>
            <div className="receipt-row">
              <span>Cashier:</span>
              <span>{sale.created_by}</span>
            </div>
            {sale.customer_name && (
              <div className="receipt-row">
                <span>Customer:</span>
                <span>{sale.customer_name}</span>
              </div>
            )}
            <div className="receipt-divider"></div>
          </div>

          <div className="receipt-items">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.item_name}</td>
                    <td>{item.quantity}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="receipt-divider"></div>
          </div>

          <div className="receipt-totals">
            <div className="receipt-row">
              <span>Subtotal:</span>
              <span>${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="receipt-row">
              <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
              <span>${sale.tax.toFixed(2)}</span>
            </div>
            <div className="receipt-row receipt-total">
              <span><strong>TOTAL:</strong></span>
              <span><strong>${sale.total.toFixed(2)}</strong></span>
            </div>
            <div className="receipt-divider"></div>
          </div>

          <div className="receipt-payment">
            <div className="receipt-row">
              <span>Payment Method:</span>
              <span className="receipt-payment-badge">{sale.payment_method.toUpperCase()}</span>
            </div>
            <div className="receipt-row">
              <span>Status:</span>
              <span className="receipt-status-badge">{sale.payment_status.toUpperCase()}</span>
            </div>
          </div>

          <div className="receipt-footer">
            <div className="receipt-divider"></div>
            <p className="receipt-thank-you">Thank you for your business!</p>
            <p className="receipt-tagline">Quality repairs, trusted service</p>
            <p className="receipt-small">Please keep this receipt for your records</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
