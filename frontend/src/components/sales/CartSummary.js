import React from 'react';
import { Star } from 'lucide-react';

/** Totals breakdown: subtotal, optional taxable amount, tax, discounts, total, points-to-earn. */
export const CartSummary = ({
  subtotal,
  taxableSubtotal,
  taxSettings,
  taxRate,
  tax,
  discount,
  pointsDiscount,
  paymentAdjustment,
  paymentAdjustmentLabel,
  total,
  pointsSettings,
  pointsEarned,
}) => (
  <>
    <div className="summary-row">
      <span>Subtotal:</span>
      <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
    </div>
    {taxSettings.tax_enabled && taxSettings.tax_exempt_categories.length > 0 && taxableSubtotal !== subtotal && (
      <div className="summary-row" style={{ fontSize: '13px', color: '#6b7280' }}>
        <span>Taxable Amount:</span>
        <span data-testid="cart-taxable">${taxableSubtotal.toFixed(2)}</span>
      </div>
    )}
    <div className="summary-row">
      <span>Tax ({taxRate.toFixed(0)}%):</span>
      <span data-testid="cart-tax">${tax.toFixed(2)}</span>
    </div>
    {discount > 0 && (
      <div className="summary-row" style={{ color: '#059669' }}>
        <span>Coupon Discount:</span>
        <span data-testid="cart-discount">-${discount.toFixed(2)}</span>
      </div>
    )}
    {pointsDiscount > 0 && (
      <div className="summary-row" style={{ color: '#8b5cf6' }}>
        <span>Points Discount:</span>
        <span data-testid="cart-points-discount">-${pointsDiscount.toFixed(2)}</span>
      </div>
    )}
    {paymentAdjustment !== 0 && (
      <div className="summary-row" style={{ color: paymentAdjustment < 0 ? '#059669' : '#dc2626' }}>
        <span>{paymentAdjustmentLabel}:</span>
        <span data-testid="cart-payment-adjustment">
          {paymentAdjustment < 0 ? '-' : '+'}${Math.abs(paymentAdjustment).toFixed(2)}
        </span>
      </div>
    )}
    <div className="summary-row total">
      <span>Total:</span>
      <span data-testid="cart-total">${total.toFixed(2)}</span>
    </div>
    {pointsSettings.points_enabled && pointsEarned > 0 && (
      <div className="summary-row" style={{ color: '#8b5cf6', fontSize: '13px', marginTop: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={14} /> Points to Earn:
        </span>
        <span data-testid="points-to-earn">+{pointsEarned} pts</span>
      </div>
    )}
  </>
);

export default CartSummary;
