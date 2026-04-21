import React from 'react';
import { Star, DollarSign } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

export const PointsSystemTab = ({ settings, setSettings }) => {
  return (
    <>
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={20} />
          Customer Loyalty Points
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
              Enable Points System
            </span>
            <Switch
              data-testid="points-toggle"
              checked={settings.points_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, points_enabled: checked }))}
              className="data-[state=checked]:bg-violet-500"
            />
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            When enabled, customers earn points on purchases
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
            Minimum Spend to Redeem Points
          </label>
          <div style={{ position: 'relative' }}>
            <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="number"
              data-testid="points-threshold-input"
              value={settings.points_redemption_threshold}
              onChange={(e) => setSettings({ ...settings, points_redemption_threshold: parseFloat(e.target.value) || 0 })}
              disabled={!settings.points_enabled}
              min="0"
              step="100"
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: settings.points_enabled ? '#fff' : '#f3f4f6',
                color: settings.points_enabled ? '#111827' : '#9ca3af'
              }}
            />
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Customers must spend this amount total before they can use points (default: $3,500)
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
            Point Value ($ per point)
          </label>
          <div style={{ position: 'relative' }}>
            <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="number"
              data-testid="points-value-input"
              value={settings.points_value}
              onChange={(e) => setSettings({ ...settings, points_value: parseFloat(e.target.value) || 1 })}
              disabled={!settings.points_enabled}
              min="0.01"
              step="0.5"
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: settings.points_enabled ? '#fff' : '#f3f4f6',
                color: settings.points_enabled ? '#111827' : '#9ca3af'
              }}
            />
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Each point = this amount in discount (default: $1)
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
          Loyalty Email Notifications
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          When enabled, customers with an email on file will automatically receive a branded email after each sale showing the points they earned. Customers crossing 100 / 500 / 1000 points also get a milestone celebration email.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Auto-Email Points Summary
          </span>
          <Switch
            data-testid="loyalty-emails-toggle"
            checked={settings.loyalty_emails_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, loyalty_emails_enabled: checked })}
            className="data-[state=checked]:bg-violet-500"
          />
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px', backgroundColor: '#faf5ff' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#7c3aed', marginBottom: '12px' }}>
          Points System Preview
        </h3>
        {!settings.points_enabled ? (
          <p style={{ fontSize: '15px', color: '#374151' }}>
            Points system is <strong>disabled</strong>
          </p>
        ) : (
          <div>
            <p style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
              • Customers earn <strong>1 point per $500 spent</strong>
            </p>
            <p style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
              • Points can be redeemed after spending <strong>${settings.points_redemption_threshold.toLocaleString()}</strong> total
            </p>
            <p style={{ fontSize: '15px', color: '#374151' }}>
              • Each point is worth <strong>${settings.points_value}</strong> in discount
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default PointsSystemTab;
