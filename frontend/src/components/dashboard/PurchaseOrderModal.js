import React, { useState } from 'react';
import axios from 'axios';
import { Mail, MessageCircle } from 'lucide-react';
import { suggestedQty } from './LowStockWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const normalizeToE164 = (raw) => {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.trim().startsWith('+')) return '+' + digits;
  if (digits.length === 10 && digits.startsWith('876')) return '+1' + digits;
  if (digits.length === 7) return '+1876' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length === 10) return '+1' + digits;
  return '+' + digits;
};

const buildPoWhatsappMessage = (supplier, items, note) => {
  const lines = [
    `Hi ${supplier}, we'd like to reorder the following items:`,
    '',
    ...items.map((it) => `- ${it.name} (SKU ${it.sku || '-'}): suggested qty ${suggestedQty(it)} (on hand ${it.quantity}, threshold ${it.low_stock_threshold})`),
  ];
  if (note) {
    lines.push('');
    lines.push(`Note: ${note}`);
  }
  lines.push('');
  lines.push('Please confirm availability and pricing. Thank you!');
  return lines.join('\n');
};

export const PurchaseOrderModal = ({ poModal, setPoModal }) => {
  const [poEmail, setPoEmail] = useState(poModal?.directory?.email || '');
  const [poNote, setPoNote] = useState('');
  const [poSending, setPoSending] = useState(false);
  const [poMsg, setPoMsg] = useState({ type: '', text: '' });

  React.useEffect(() => {
    setPoEmail(poModal?.directory?.email || '');
    setPoNote('');
    setPoMsg({ type: '', text: '' });
  }, [poModal?.supplier, poModal?.directory?.email]);

  if (!poModal) return null;

  const sharePoWhatsApp = () => {
    const target = poModal.directory?.whatsapp_number || poModal.directory?.phone;
    if (!target) {
      setPoMsg({ type: 'error', text: 'No WhatsApp/phone number saved for this supplier. Add one in the Suppliers page.' });
      return;
    }
    const phone = normalizeToE164(target).replace(/\D/g, '');
    if (!phone) {
      setPoMsg({ type: 'error', text: 'Invalid WhatsApp number for this supplier.' });
      return;
    }
    const text = encodeURIComponent(buildPoWhatsappMessage(poModal.supplier, poModal.items, poNote));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const sendPO = async () => {
    if (!poEmail.trim()) {
      setPoMsg({ type: 'error', text: 'Supplier email is required' });
      return;
    }
    setPoSending(true);
    try {
      const r = await axios.post(
        `${API}/inventory/email-purchase-order`,
        {
          to_email: poEmail.trim(),
          supplier_name: poModal.supplier,
          note: poNote,
          item_ids: poModal.items.map((it) => it.id),
        }
      );
      setPoMsg({ type: 'success', text: `PO emailed to ${r.data.recipient} (${r.data.items_count} items)` });
      setTimeout(() => setPoModal(null), 1600);
    } catch (error) {
      setPoMsg({ type: 'error', text: error.response?.data?.detail || 'Failed to send PO' });
    } finally {
      setPoSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setPoModal(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="po-modal" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={20} color="#d97706" />
            Email PO to {poModal.supplier}
          </h2>
          <button className="btn-close" onClick={() => setPoModal(null)}>×</button>
        </div>
        <div className="modal-body">
          {poMsg.text && (
            <div style={{
              padding: '10px 12px', borderRadius: '8px', marginBottom: '12px',
              backgroundColor: poMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: poMsg.type === 'success' ? '#065f46' : '#991b1b',
            }}>{poMsg.text}</div>
          )}
          <div className="form-group">
            <label>Supplier Email</label>
            <input
              type="email"
              data-testid="po-email-input"
              value={poEmail}
              onChange={(e) => setPoEmail(e.target.value)}
              placeholder="supplier@example.com"
            />
            {poModal.directory && (
              <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                ✓ Auto-filled from supplier directory
              </p>
            )}
          </div>
          <div className="form-group">
            <label>Note (optional)</label>
            <textarea
              data-testid="po-note-input"
              rows={3}
              value={poNote}
              onChange={(e) => setPoNote(e.target.value)}
              placeholder="e.g. Please confirm prices and estimated delivery."
            />
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>
            The email will include the {poModal.items.length} low-stock item{poModal.items.length === 1 ? '' : 's'} for <strong>{poModal.supplier}</strong> with suggested order quantities.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" onClick={() => setPoModal(null)}>Cancel</button>
            <button
              type="button"
              data-testid="po-whatsapp-btn"
              onClick={sharePoWhatsApp}
              disabled={!poModal.directory?.whatsapp_number && !poModal.directory?.phone}
              title={
                (poModal.directory?.whatsapp_number || poModal.directory?.phone)
                  ? 'Open WhatsApp with PO pre-filled'
                  : 'No WhatsApp/phone saved for this supplier'
              }
              style={{
                padding: '10px 14px', background: '#22c55e', color: '#fff',
                border: 'none', borderRadius: '8px', fontWeight: 600,
                cursor: (poModal.directory?.whatsapp_number || poModal.directory?.phone) ? 'pointer' : 'not-allowed',
                opacity: (poModal.directory?.whatsapp_number || poModal.directory?.phone) ? 1 : 0.45,
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button
              type="button"
              data-testid="po-send-btn"
              onClick={sendPO}
              disabled={poSending}
              style={{
                padding: '10px 18px', background: '#d97706', color: '#fff',
                border: 'none', borderRadius: '8px', fontWeight: 600,
                cursor: poSending ? 'not-allowed' : 'pointer', opacity: poSending ? 0.7 : 1,
              }}
            >
              {poSending ? 'Sending...' : 'Send PO Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
