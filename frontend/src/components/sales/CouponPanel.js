import React from 'react';

/** Coupon code entry + "available coupons" expandable picker. */
export const CouponPanel = ({
  appliedCoupon,
  removeCoupon,
  couponCode,
  setCouponCode,
  applyCoupon,
  couponError,
  cart,
  availableCoupons,
  showCouponList,
  setShowCouponList,
  selectCoupon,
}) => (
  <div style={{
    marginTop: '16px', padding: '12px',
    background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff',
  }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#7c3aed' }}>
      🎟️ Coupon Code
    </label>
    {appliedCoupon ? (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', backgroundColor: '#d1fae5', borderRadius: '6px', border: '1px solid #a7f3d0',
      }}>
        <div>
          <span style={{ fontWeight: '700', fontFamily: 'monospace', color: '#065f46' }}>
            {appliedCoupon.code}
          </span>
          <span style={{ marginLeft: '8px', fontSize: '13px', color: '#047857' }}>
            ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% off` : `$${appliedCoupon.discount_value} off`})
          </span>
        </div>
        <button
          onClick={removeCoupon}
          data-testid="remove-coupon-btn"
          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '18px', fontWeight: '700' }}
        >
          ×
        </button>
      </div>
    ) : (
      <>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            data-testid="coupon-input"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            style={{
              flex: 1, padding: '8px 12px', border: '1px solid #d1d5db',
              borderRadius: '6px', fontFamily: 'monospace', textTransform: 'uppercase', fontSize: '14px',
            }}
            onKeyPress={(e) => { if (e.key === 'Enter') applyCoupon(); }}
          />
          <button
            onClick={() => applyCoupon()}
            data-testid="apply-coupon-btn"
            disabled={!couponCode.trim() || cart.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: couponCode.trim() && cart.length > 0 ? '#8b5cf6' : '#e5e7eb',
              color: couponCode.trim() && cart.length > 0 ? '#fff' : '#9ca3af',
              border: 'none', borderRadius: '6px', fontWeight: '600',
              cursor: couponCode.trim() && cart.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
            }}
          >
            Apply
          </button>
        </div>
        {couponError && (
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }} data-testid="coupon-error">
            {couponError}
          </div>
        )}

        {availableCoupons.length > 0 && cart.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => setShowCouponList(!showCouponList)}
              data-testid="show-coupons-btn"
              style={{
                width: '100%', padding: '8px', backgroundColor: 'transparent',
                border: '1px dashed #c4b5fd', borderRadius: '6px', color: '#7c3aed',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {showCouponList ? '▲ Hide' : '▼ View'} Available Coupons ({availableCoupons.length})
            </button>

            {showCouponList && (
              <div style={{
                marginTop: '8px', maxHeight: '200px', overflowY: 'auto',
                border: '1px solid #e9d5ff', borderRadius: '8px', backgroundColor: '#fff',
              }}>
                {availableCoupons.map((coupon) => {
                  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
                  const meetsMinimum = cartSubtotal >= (coupon.min_purchase || 0);
                  return (
                    <button
                      key={coupon.id}
                      data-testid={`select-coupon-${coupon.code}`}
                      onClick={() => meetsMinimum && selectCoupon(coupon)}
                      disabled={!meetsMinimum}
                      style={{
                        width: '100%', padding: '10px 12px',
                        backgroundColor: meetsMinimum ? '#fff' : '#f9fafb',
                        border: 'none', borderBottom: '1px solid #f3e8ff',
                        cursor: meetsMinimum ? 'pointer' : 'not-allowed',
                        textAlign: 'left', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        opacity: meetsMinimum ? 1 : 0.6,
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => { if (meetsMinimum) e.currentTarget.style.backgroundColor = '#faf5ff'; }}
                      onMouseLeave={(e) => { if (meetsMinimum) e.currentTarget.style.backgroundColor = '#fff'; }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', color: '#7c3aed' }}>
                            {coupon.code}
                          </span>
                          <span style={{
                            backgroundColor: '#d1fae5', color: '#065f46',
                            padding: '2px 6px', borderRadius: '4px',
                            fontSize: '11px', fontWeight: '600',
                          }}>
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}% OFF`
                              : `$${coupon.discount_value} OFF`}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {coupon.description || 'No description'}
                          {coupon.min_purchase > 0 && (
                            <span style={{ marginLeft: '8px', color: meetsMinimum ? '#059669' : '#dc2626' }}>
                              • Min ${coupon.min_purchase}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ color: meetsMinimum ? '#8b5cf6' : '#9ca3af', fontSize: '18px' }}>→</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </>
    )}
  </div>
);

export default CouponPanel;
