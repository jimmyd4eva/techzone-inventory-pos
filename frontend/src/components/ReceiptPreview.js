import React, { useMemo } from 'react';
import { sanitizeRichText, hasHtml } from '../utils/sanitize';

const applyColorSplit = (html, firstColor = '#2563eb', secondColor = '#dc2626') => {
  if (!html) return '';
  // Sanitize BEFORE touching the DOM — offscreen innerHTML can still trigger
  // `<img onerror>` during parsing. See Receipt.js for details.
  const clean = sanitizeRichText(html);
  const container = document.createElement('div');
  container.innerHTML = clean;
  const fullText = container.textContent || '';
  if (!fullText) return clean;
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

const sanitize = sanitizeRichText;

// Memoize sanitized HTML so dangerouslySetInnerHTML doesn't see a new object
// on every keystroke in the Settings form.
const FormattedBlock = ({ value, testId, style }) => {
  const html = useMemo(() => sanitize(value), [value]);
  return (
    <div
      data-testid={testId}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// A compact, static preview of how the receipt header will print.
// Reflects the currently-typed (unsaved) settings state.
export const ReceiptPreview = ({ settings }) => {
  const businessName = settings?.business_name || 'TECHZONE';
  const businessAddress = settings?.business_address || '';
  const businessPhone = settings?.business_phone || '';
  const businessLogo = settings?.business_logo || '';

  const businessNameHtml = useMemo(
    () => (hasHtml(businessName) ? sanitize(applyColorSplit(businessName)) : null),
    [businessName],
  );
  const renderBusinessName = () => {
    if (businessNameHtml) {
      return (
        <h2
          data-testid="preview-business-name"
          style={{ fontSize: '22px', fontWeight: 'bold', margin: '6px 0', textAlign: 'center' }}
          dangerouslySetInnerHTML={{ __html: businessNameHtml }}
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
        <FormattedBlock
          value={value}
          testId={testId}
          style={{ fontSize: '13px', color: '#374151', textAlign: 'center', margin: '2px 0' }}
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
      {settings?.receipt_thankyou_html ? (
        <FormattedBlock
          value={settings.receipt_thankyou_html}
          testId="preview-receipt-thankyou"
          style={{ fontSize: '13px', color: '#374151', textAlign: 'center', fontWeight: 600, margin: '2px 0' }}
        />
      ) : null}
      {settings?.receipt_tagline_html ? (
        <FormattedBlock
          value={settings.receipt_tagline_html}
          testId="preview-receipt-tagline"
          style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: '2px 0' }}
        />
      ) : null}
      {settings?.receipt_footer_note_html ? (
        <FormattedBlock
          value={settings.receipt_footer_note_html}
          testId="preview-receipt-footer-note"
          style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: '2px 0 8px 0' }}
        />
      ) : null}
      <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
        This is a live preview — not saved until you click "Save Settings".
      </div>
    </div>
  );
};

export default ReceiptPreview;
