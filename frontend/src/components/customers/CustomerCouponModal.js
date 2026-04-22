import React from 'react';

export const CustomerCouponModal = ({
  couponForCustomer, couponForm, setCouponForm, couponMsg, couponSaving,
  createdCoupon, emailingCoupon, onClose, submitCustomerCoupon,
  shareViaSMS, shareViaWhatsApp, emailCouponToCustomer,
}) => (
  <div className="modal-overlay" onClick={() => onClose()}>
    <div
      className="modal"
      onClick={(e) => e.stopPropagation()}
      data-testid="customer-coupon-modal"
      style={{ maxWidth: '480px' }}
    >
      <div className="modal-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ticket size={20} color="#7c3aed" />
          Coupon for {couponForCustomer.name}
        </h2>
        <button
          className="btn-close"
          onClick={() => onClose()}
          data-testid="close-customer-coupon-btn"
        >×</button>
      </div>
      <div className="modal-body">
        {couponMsg.text && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            marginBottom: '12px',
            backgroundColor: couponMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: couponMsg.type === 'success' ? '#065f46' : '#991b1b'
          }}>{couponMsg.text}</div>
        )}
        <div className="form-group">
          <label>Coupon Code</label>
          <input
            type="text"
            data-testid="customer-coupon-code-input"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
            placeholder="VIP123"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={couponForm.description}
            onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Discount Type</label>
            <select
              data-testid="customer-coupon-type-select"
              value={couponForm.discount_type}
              onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div className="form-group">
            <label>{couponForm.discount_type === 'percentage' ? 'Discount (%)' : 'Discount ($)'}</label>
            <input
              type="number"
              data-testid="customer-coupon-value-input"
              value={couponForm.discount_value}
              onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Min Purchase ($)</label>
            <input
              type="number"
              value={couponForm.min_purchase}
              onChange={(e) => setCouponForm({ ...couponForm, min_purchase: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>Usage Limit</label>
            <input
              type="number"
              value={couponForm.usage_limit}
              onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
              min="1"
              placeholder="Unlimited"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onClose()}
          >{createdCoupon ? 'Done' : 'Cancel'}</button>
          {!createdCoupon && (
            <button
              type="button"
              data-testid="submit-customer-coupon-btn"
              onClick={submitCustomerCoupon}
              disabled={couponSaving}
              style={{
                padding: '10px 18px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: couponSaving ? 'not-allowed' : 'pointer',
                opacity: couponSaving ? 0.7 : 1,
              }}
            >
              {couponSaving ? 'Creating...' : 'Create Coupon'}
            </button>
          )}
        </div>

        {createdCoupon && (
          <div
            data-testid="share-coupon-panel"
            style={{
              marginTop: '16px',
              padding: '16px',
              background: '#faf5ff',
              border: '1px solid #ddd6fe',
              borderRadius: '10px',
            }}
          >
            <p style={{ fontSize: '13px', color: '#6b21a8', margin: '0 0 12px 0', fontWeight: '600' }}>
              Share this coupon with {couponForCustomer?.name}:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                data-testid="share-sms-btn"
                onClick={shareViaSMS}
                disabled={!couponForCustomer?.phone}
                title={couponForCustomer?.phone ? 'Open SMS app' : 'No phone on file'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', backgroundColor: '#3b82f6', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  cursor: couponForCustomer?.phone ? 'pointer' : 'not-allowed',
                  opacity: couponForCustomer?.phone ? 1 : 0.5,
                }}
              >
                <MessageSquare size={14} /> SMS
              </button>
              <button
                type="button"
                data-testid="share-whatsapp-btn"
                onClick={shareViaWhatsApp}
                disabled={!couponForCustomer?.phone}
                title={couponForCustomer?.phone ? 'Open WhatsApp' : 'No phone on file'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', backgroundColor: '#22c55e', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  cursor: couponForCustomer?.phone ? 'pointer' : 'not-allowed',
                  opacity: couponForCustomer?.phone ? 1 : 0.5,
                }}
              >
                <Send size={14} /> WhatsApp
              </button>
              <button
                type="button"
                data-testid="share-email-btn"
                onClick={emailCouponToCustomer}
                disabled={emailingCoupon || !couponForCustomer?.email}
                title={couponForCustomer?.email ? `Email to ${couponForCustomer.email}` : 'No email on file'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', backgroundColor: '#8b5cf6', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  cursor: (emailingCoupon || !couponForCustomer?.email) ? 'not-allowed' : 'pointer',
                  opacity: (emailingCoupon || !couponForCustomer?.email) ? 0.5 : 1,
                }}
              >
                <Mail size={14} /> {emailingCoupon ? 'Sending...' : 'Email'}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', marginBottom: 0 }}>
              SMS and WhatsApp open the chat app with the message pre-filled — you tap Send.
              {!couponForCustomer?.email && ' · Email is disabled (no email on file).'}
              {!couponForCustomer?.phone && ' · SMS/WhatsApp are disabled (no phone on file).'}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default CustomerCouponModal;
