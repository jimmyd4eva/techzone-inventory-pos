import React, { useState } from 'react';
import axios from 'axios';
import { Star, DollarSign, Cake } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PointsSystemTab = ({ settings, setSettings }) => {
  const [bdayMsg, setBdayMsg] = useState({ type: '', text: '' });
  const [bdayRunning, setBdayRunning] = useState(false);

  const runBirthdaySweep = async () => {
    setBdayRunning(true);
    setBdayMsg({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const r = await axios.post(`${API}/settings/run-birthday-sweep`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBdayMsg({
        type: 'success',
        text: `Sweep ran for ${r.data.last_run}. ${r.data.coupons_this_year} birthday coupon(s) issued this year.`,
      });
    } catch (e) {
      setBdayMsg({ type: 'error', text: e.response?.data?.detail || 'Failed to run sweep' });
    } finally {
      setBdayRunning(false);
    }
  };

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

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
          Follow-up Check-in Emails
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          Auto-schedule a friendly check-in email a few days after each sale ("Is everything working?"). Great for catching warranty issues early and prompting reviews.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Enable Follow-up Emails
          </span>
          <Switch
            data-testid="followup-emails-toggle"
            checked={settings.followup_emails_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, followup_emails_enabled: checked })}
            className="data-[state=checked]:bg-violet-500"
          />
        </div>
        {settings.followup_emails_enabled && (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
              Days After Sale
            </label>
            <input
              type="number"
              data-testid="followup-days-input"
              min="1"
              max="90"
              value={settings.followup_days}
              onChange={(e) => setSettings({ ...settings, followup_days: parseInt(e.target.value) || 14 })}
              style={{ width: '120px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Emails are dispatched hourly by the scheduler once the send time passes.
            </p>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Google Review URL (optional)
              </label>
              <input
                type="url"
                data-testid="google-review-url-input"
                placeholder="https://g.page/r/your-business-id/review"
                value={settings.google_review_url || ''}
                onChange={(e) => setSettings({ ...settings, google_review_url: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace' }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                When set, a green "★ Leave a review" button is added to every follow-up email.
                Tip: paste the short link from your Google Business Profile → Get more reviews.
              </p>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                VIP Spend Threshold
              </label>
              <div style={{ position: 'relative', maxWidth: '220px' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="number"
                  data-testid="vip-threshold-input"
                  min="0"
                  step="500"
                  placeholder="20000"
                  value={settings.vip_spend_threshold ?? 20000}
                  onChange={(e) => setSettings({ ...settings, vip_spend_threshold: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Customers whose lifetime spend reaches this amount get the upgraded "You're a VIP" review CTA. First-time buyers always get the "How was your first experience?" variant instead.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cake size={18} color="#ec4899" />
          Birthday Coupons
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          Once a day the system sweeps your customer list. Anyone whose birthday is today gets a personalized % off coupon automatically created and emailed (only if they have an email on file). Each customer is guaranteed only one birthday coupon per year.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Enable Birthday Coupons
          </span>
          <Switch
            data-testid="birthday-coupons-toggle"
            checked={settings.birthday_coupons_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, birthday_coupons_enabled: checked })}
            className="data-[state=checked]:bg-pink-500"
          />
        </div>
        {settings.birthday_coupons_enabled && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Discount %
              </label>
              <input
                type="number"
                data-testid="birthday-discount-input"
                min="1"
                max="90"
                step="1"
                value={settings.birthday_discount_percent ?? 15}
                onChange={(e) => setSettings({ ...settings, birthday_discount_percent: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Coupon Valid (days)
              </label>
              <input
                type="number"
                data-testid="birthday-valid-days-input"
                min="1"
                max="90"
                step="1"
                value={settings.birthday_valid_days ?? 14}
                onChange={(e) => setSettings({ ...settings, birthday_valid_days: parseInt(e.target.value, 10) || 14 })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>
            <div style={{ flex: '1 1 100%', display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                data-testid="run-birthday-sweep-btn"
                onClick={runBirthdaySweep}
                disabled={bdayRunning}
                style={{
                  padding: '10px 16px', background: '#ec4899', color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                  cursor: bdayRunning ? 'not-allowed' : 'pointer', opacity: bdayRunning ? 0.7 : 1,
                }}
              >
                {bdayRunning ? 'Running…' : 'Run today\u2019s sweep now'}
              </button>
              {bdayMsg.text ? (
                <span
                  data-testid="birthday-sweep-msg"
                  style={{
                    fontSize: '13px',
                    color: bdayMsg.type === 'success' ? '#065f46' : '#991b1b',
                  }}
                >{bdayMsg.text}</span>
              ) : null}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', width: '100%', marginTop: '4px' }}>
              Customers must have a <code>birthday</code> (MM-DD) set on their profile. The sweep runs automatically every hour; the button above forces it to re-run today.
            </p>
          </div>
        )}
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
