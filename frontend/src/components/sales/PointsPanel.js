import React from 'react';
import { Star } from 'lucide-react';

/** Loyalty-points redemption panel. Only rendered when points enabled AND a customer is selected. */
export const PointsPanel = ({
  selectedCustomer,
  pointsSettings,
  canRedeemPoints,
  maxPointsToUse,
  pointsToUse,
  setPointsToUse,
}) => (
  <div style={{
    marginTop: '16px', padding: '12px',
    background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d',
  }}>
    <label style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#92400e',
    }}>
      <Star size={16} /> Loyalty Points
    </label>

    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
      <span style={{ color: '#78350f' }}>Available Points:</span>
      <span style={{ fontWeight: '700', color: '#b45309' }} data-testid="available-points">
        {(selectedCustomer.points_balance || 0).toFixed(0)} pts
      </span>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#92400e' }}>
      <span>Total Spent:</span>
      <span>${(selectedCustomer.total_spent || 0).toFixed(2)}</span>
    </div>

    {canRedeemPoints ? (
      <>
        <div style={{
          fontSize: '12px', color: '#059669', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          ✓ Eligible to redeem (1 pt = ${pointsSettings.points_value})
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            min="0"
            max={maxPointsToUse}
            value={pointsToUse}
            onChange={(e) => setPointsToUse(Math.min(Math.max(0, parseInt(e.target.value) || 0), maxPointsToUse))}
            placeholder="0"
            data-testid="points-input"
            style={{
              flex: 1, padding: '8px 12px',
              border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '14px',
            }}
          />
          <button
            type="button"
            onClick={() => setPointsToUse(maxPointsToUse)}
            data-testid="use-all-points-btn"
            style={{
              padding: '8px 12px', backgroundColor: '#f59e0b', color: 'white',
              border: 'none', borderRadius: '6px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Use All
          </button>
        </div>
        {pointsToUse > 0 && (
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
            Discount: -${(pointsToUse * pointsSettings.points_value).toFixed(2)}
          </div>
        )}
      </>
    ) : (
      <div style={{
        fontSize: '12px', color: '#b45309',
        padding: '8px', backgroundColor: '#fef9c3', borderRadius: '6px',
      }}>
        {selectedCustomer.points_balance <= 0
          ? '⚠️ No points to redeem'
          : `⚠️ Need $${pointsSettings.points_redemption_threshold.toLocaleString()} total spent to redeem (currently $${(selectedCustomer.total_spent || 0).toFixed(2)})`}
      </div>
    )}
  </div>
);

export default PointsPanel;
