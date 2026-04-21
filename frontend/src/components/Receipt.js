import React from 'react';
import DOMPurify from 'dompurify';
import './Receipt.css';

// Detect whether a string contains any HTML tags (vs. plain text)
const hasHtml = (str) => /<[a-z][\s\S]*>/i.test(str || '');

// Apply the TECHZONE blue/red split to formatted HTML by coloring text nodes.
// Preserves all existing formatting (bold, italic, underline, font-size) while
// overriding only the text color to keep the brand split effect.
const applyColorSplit = (html, firstColor = '#2563eb', secondColor = '#dc2626') => {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = html;
  const fullText = container.textContent || '';
  if (!fullText) return html;

  const mid = Math.ceil(fullText.length / 2);
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  let consumed = 0;
  for (const textNode of nodes) {
    const text = textNode.nodeValue;
    const start = consumed;
    const end = consumed + text.length;
    const parent = textNode.parentNode;
    if (!parent) {
      consumed = end;
      continue;
    }

    if (end <= mid) {
      const span = document.createElement('span');
      span.style.color = firstColor;
      span.textContent = text;
      parent.replaceChild(span, textNode);
    } else if (start >= mid) {
      const span = document.createElement('span');
      span.style.color = secondColor;
      span.textContent = text;
      parent.replaceChild(span, textNode);
    } else {
      const firstPart = text.slice(0, mid - start);
      const secondPart = text.slice(mid - start);
      const span1 = document.createElement('span');
      span1.style.color = firstColor;
      span1.textContent = firstPart;
      const span2 = document.createElement('span');
      span2.style.color = secondColor;
      span2.textContent = secondPart;
      const frag = document.createDocumentFragment();
      frag.appendChild(span1);
      frag.appendChild(span2);
      parent.replaceChild(frag, textNode);
    }
    consumed = end;
  }
  return container.innerHTML;
};

const sanitize = (html) =>
  DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'span', 'p', 'br', 'div', 'font'],
    ALLOWED_ATTR: ['style', 'color', 'size', 'face'],
  });

const Receipt = ({ sale, onClose, businessSettings }) => {
  const businessName = businessSettings?.business_name || 'TECHZONE';
  const businessAddress = businessSettings?.business_address || '30 Giltress Street, Kingston 2, JA';
  const businessPhone = businessSettings?.business_phone || '876-633-9251';
  const businessLogo = businessSettings?.business_logo || '/techzone-logo.jpg';
  const taxRate = businessSettings?.tax_rate || 0.10;

  const handlePrint = () => {
    try {
      setTimeout(() => window.print(), 100);
    } catch (error) {
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

  // Business Name rendering: if HTML formatting is present, apply blue/red split
  // over the formatted HTML; otherwise use the legacy plain-text split.
  const renderBusinessName = () => {
    if (hasHtml(businessName)) {
      const splitHtml = applyColorSplit(businessName);
      return (
        <h1
          className="receipt-title"
          data-testid="receipt-business-name"
          dangerouslySetInnerHTML={{ __html: sanitize(splitHtml) }}
        />
      );
    }
    const nameParts = businessName.split('');
    const midPoint = Math.ceil(nameParts.length / 2);
    const firstPart = nameParts.slice(0, midPoint).join('');
    const secondPart = nameParts.slice(midPoint).join('');
    return (
      <h1 className="receipt-title" data-testid="receipt-business-name">
        <span className="text-blue">{firstPart}</span>
        <span className="text-red">{secondPart}</span>
      </h1>
    );
  };

  const renderFormatted = (value, className, testId) => {
    if (hasHtml(value)) {
      return (
        <div
          className={className}
          data-testid={testId}
          dangerouslySetInnerHTML={{ __html: sanitize(value) }}
        />
      );
    }
    return (
      <p className={className} data-testid={testId}>
        {value}
      </p>
    );
  };

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
                alt="Logo"
                style={{ width: '230px', height: 'auto', display: 'block' }}
                onError={(e) => { e.target.src = '/techzone-logo.jpg'; }}
              />
            </div>
            {renderBusinessName()}
            {renderFormatted(businessAddress, 'receipt-address', 'receipt-business-address')}
            {renderFormatted(businessPhone, 'receipt-contact', 'receipt-business-phone')}
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
