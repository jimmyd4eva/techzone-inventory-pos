import React from 'react';
import DOMPurify from 'dompurify';

// Shared helpers with Receipt.js — kept local to keep Settings bundle light.
const hasHtml = (str) => /<[a-z][\s\S]*>/i.test(str || '');

const applyColorSplit = (html, firstColor = '#2563eb', secondColor = '#dc2626') => {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = html;
  const fullText = container.textContent || '';
  if (!fullText) return html;
  const mid = Math.ceil(fullText.length / 2);
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  let consumed = 0;
  for (const textNode of nodes) {
    const text = textNode.nodeValue;
    const start = consumed;
    const end = consumed + text.length;
    const parent = textNode.parentNode;
    if (!parent) { consumed = end; continue; }
    if (end <= mid) {
      const s = document.createElement('span');
      s.style.color = firstColor;
      s.textContent = text;
      parent.replaceChild(s, textNode);
    } else if (start >= mid) {
      const s = document.createElement('span');
      s.style.color = secondColor;
      s.textContent = text;
      parent.replaceChild(s, textNode);
    } else {
      const firstPart = text.slice(0, mid - start);
      const secondPart = text.slice(mid - start);
      const s1 = document.createElement('span');
      s1.style.color = firstColor;
      s1.textContent = firstPart;
      const s2 = document.createElement('span');
      s2.style.color = secondColor;
      s2.textContent = secondPart;
      const frag = document.createDocumentFragment();
      frag.appendChild(s1);
      frag.appendChild(s2);
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

// A compact, static preview of how the receipt header will print.
// Reflects the currently-typed (unsaved) settings state.
export const ReceiptPreview = ({ settings }) => {
  const businessName = settings?.business_name || 'TECHZONE';
  const businessAddress = settings?.business_address || '';
  const businessPhone = settings?.business_phone || '';
  const businessLogo = settings?.business_logo || '';

  const renderBusinessName = () => {
    if (hasHtml(businessName)) {
      return (
        <h2
          data-testid="preview-business-name"
          style={{ fontSize: '22px', fontWeight: 'bold', margin: '6px 0', textAlign: 'center' }}
          dangerouslySetInnerHTML={{ __html: sanitize(applyColorSplit(businessName)) }}
        />
      );
    }
    const mid = Math.ceil(businessName.length / 2);
    return (
      <h2
        data-testid="preview-business-name"
        style={{ fontSize: '22px', fontWeight: 'bold', margin: '6px 0', textAlign: 'center' }}
      >
        <span style={{ color: '#2563eb' }}>{businessName.slice(0, mid)}</span>
        <span style={{ color: '#dc2626' }}>{businessName.slice(mid)}</span>
      </h2>
    );
  };

  const renderHtmlOrText = (value, testId) => {
    if (hasHtml(value)) {
      return (
        <div
          data-testid={testId}
          style={{ fontSize: '13px', color: '#374151', textAlign: 'center', margin: '2px 0' }}
          dangerouslySetInnerHTML={{ __html: sanitize(value) }}
        />
      );
    }
    return (
      <div
        data-testid={testId}
        style={{ fontSize: '13px', color: '#374151', textAlign: 'center', margin: '2px 0' }}
      >
        {value}
      </div>
    );
  };

  return (
    <div
      data-testid="receipt-live-preview"
      style={{
        background: '#ffffff',
        border: '1px dashed #9ca3af',
        borderRadius: '10px',
        padding: '20px',
        maxWidth: '360px',
        margin: '12px auto 0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        fontFamily: '"Courier New", monospace',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        {businessLogo ? (
          <img
            src={businessLogo}
            alt="logo"
            style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : null}
      </div>
      {renderBusinessName()}
      {businessAddress ? renderHtmlOrText(businessAddress, 'preview-business-address') : null}
      {businessPhone ? renderHtmlOrText(businessPhone, 'preview-business-phone') : null}

      <div style={{ borderTop: '1px dashed #9ca3af', margin: '12px 0' }} />

      <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginBottom: '8px' }}>
        Sample items
      </div>
      <div style={{ fontSize: '12px', color: '#374151' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Phone Case</span><span>$19.99</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Screen Protector</span><span>$9.99</span>
        </div>
      </div>
      <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
        <span>TOTAL</span><span>$29.98</span>
      </div>
      <div style={{ borderTop: '1px dashed #9ca3af', margin: '10px 0' }} />
      <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
        This is a live preview — not saved until you click "Save Settings".
      </div>
    </div>
  );
};

export default ReceiptPreview;
