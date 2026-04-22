import React from 'react';
import { AlertCircle, Wallet } from 'lucide-react';

/** Payment method picker + register-open warnings + checkout + clear cart. */
export const CheckoutPanel = ({
  paymentMethod,
  setPaymentMethod,
  currentShift,
  setShowOpenRegisterModal,
  cart,
  processing,
  total,
  handleCheckout,
  onClearCart,
}) => (
  <>
    <div className="payment-methods">
      <button
        className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
        onClick={() => setPaymentMethod('cash')}
        data-testid="payment-cash-btn"
      >
        💵 Cash
      </button>
      <button
        className={`payment-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
        onClick={() => setPaymentMethod('stripe')}
        data-testid="payment-card-btn"
      >
        💳 Credit Card/Debit Card
      </button>
    </div>

    {paymentMethod === 'cash' && !currentShift && (
      <div style={{
        backgroundColor: '#fef3c7', border: '1px solid #fcd34d',
        borderRadius: '8px', padding: '12px', marginBottom: '12px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
            No register open
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#a16207' }}>
            Cash sales won't be tracked until you open a register
          </p>
        </div>
        <button
          onClick={() => setShowOpenRegisterModal(true)}
          data-testid="open-register-quick-btn"
          style={{
            padding: '8px 14px', backgroundColor: '#059669', color: 'white',
            border: 'none', borderRadius: '6px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
          }}
        >
          <Wallet size={16} />
          Open Register
        </button>
      </div>
    )}

    {currentShift && (
      <div style={{
        backgroundColor: '#d1fae5', border: '1px solid #86efac',
        borderRadius: '8px', padding: '10px 12px', marginBottom: '12px',
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '13px', color: '#065f46',
      }}>
        <Wallet size={16} style={{ color: '#059669' }} />
        <span><strong>Register Open</strong> - Cash sales being tracked</span>
      </div>
    )}

    <button
      className="btn-checkout"
      onClick={handleCheckout}
      disabled={cart.length === 0 || processing}
      data-testid="checkout-btn"
      style={{ marginBottom: '10px' }}
    >
      {processing ? 'Processing...' : `Checkout - $${total.toFixed(2)}`}
    </button>

    <button
      className="btn-secondary"
      onClick={onClearCart}
      disabled={cart.length === 0}
      data-testid="cancel-sale-btn"
      style={{
        width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
        background: cart.length === 0 ? '#e2e8f0' : '#ef4444', color: 'white',
        fontSize: '1rem', fontWeight: '600',
        cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        opacity: cart.length === 0 ? 0.6 : 1,
      }}
      onMouseEnter={(e) => { if (cart.length > 0) e.currentTarget.style.background = '#dc2626'; }}
      onMouseLeave={(e) => { if (cart.length > 0) e.currentTarget.style.background = '#ef4444'; }}
    >
      Clear Cart
    </button>
  </>
);

export default CheckoutPanel;
