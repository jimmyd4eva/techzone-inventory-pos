import React from 'react';
import { DollarSign } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

export const PricingTab = ({ settings, setSettings }) => {
  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DollarSign size={20} />
        Dual Pricing Configuration
      </h2>

      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
        Configure different pricing for wholesale customers and payment method adjustments (cash discount or card surcharge).
      </p>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
            Enable Dual Pricing
          </span>
          <Switch
            data-testid="dual-pricing-toggle"
            checked={settings.dual_pricing_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, dual_pricing_enabled: checked })}
          />
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          When enabled, wholesale customers get wholesale prices and payment method adjustments apply.
        </p>
      </div>

      {settings.dual_pricing_enabled && (
        <>
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #93c5fd'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1d4ed8', marginBottom: '8px' }}>
              Retail vs Wholesale Pricing
            </h3>
            <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
              • Set wholesale prices in <strong>Inventory</strong> for each item<br/>
              • Mark customers as "Wholesale" in <strong>Customers</strong> page<br/>
              • Wholesale customers automatically see wholesale prices at checkout
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Cash Discount (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.cash_discount_percent}
              onChange={(e) => setSettings({ ...settings, cash_discount_percent: parseFloat(e.target.value) || 0 })}
              data-testid="cash-discount-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="e.g., 2 for 2% discount"
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Discount applied when customer pays with cash
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Card Surcharge (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.card_surcharge_percent}
              onChange={(e) => setSettings({ ...settings, card_surcharge_percent: parseFloat(e.target.value) || 0 })}
              data-testid="card-surcharge-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="e.g., 3 for 3% surcharge"
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Surcharge applied when customer pays with card (Stripe/PayPal)
            </p>
          </div>

          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #86efac'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
              Example
            </h3>
            <p style={{ fontSize: '13px', color: '#15803d', margin: 0 }}>
              For a $100 order:<br/>
              • Cash payment: ${(100 - (100 * settings.cash_discount_percent / 100)).toFixed(2)}
              {settings.cash_discount_percent > 0 && ` (saves $${(100 * settings.cash_discount_percent / 100).toFixed(2)})`}<br/>
              • Card payment: ${(100 + (100 * settings.card_surcharge_percent / 100)).toFixed(2)}
              {settings.card_surcharge_percent > 0 && ` (+$${(100 * settings.card_surcharge_percent / 100).toFixed(2)} fee)`}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default PricingTab;
