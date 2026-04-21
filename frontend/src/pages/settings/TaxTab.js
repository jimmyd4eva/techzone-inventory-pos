import React from 'react';
import { Percent, DollarSign, Tag, Check } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

export const PRODUCT_CATEGORIES = [
  { id: 'phone', label: 'Phones', description: 'Mobile phones and smartphones' },
  { id: 'part', label: 'Parts', description: 'Replacement parts and components' },
  { id: 'accessory', label: 'Accessories', description: 'Phone cases, chargers, etc.' },
  { id: 'screen', label: 'Screens', description: 'Screen replacements' },
  { id: 'other', label: 'Other', description: 'Miscellaneous items' }
];

export const TaxTab = ({ settings, setSettings, toggleCategoryExemption }) => {
  const taxableCategories = PRODUCT_CATEGORIES.filter(
    c => !settings.tax_exempt_categories.includes(c.id)
  );

  return (
    <>
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
          Tax Configuration
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
              Enable Tax
            </span>
            <Switch
              data-testid="tax-toggle"
              checked={settings.tax_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, tax_enabled: checked }))}
              className="data-[state=checked]:bg-violet-500"
            />
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            When enabled, tax will be applied to sales based on product category
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
            Tax Rate
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              data-testid="tax-rate-input"
              value={settings.tax_rate}
              onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
              disabled={!settings.tax_enabled}
              min="0"
              max="100"
              step="0.1"
              style={{
                width: '100%',
                padding: '12px 40px 12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: settings.tax_enabled ? '#fff' : '#f3f4f6',
                color: settings.tax_enabled ? '#111827' : '#9ca3af'
              }}
            />
            <Percent size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
            Currency
          </label>
          <div style={{ position: 'relative' }}>
            <select
              data-testid="currency-select"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 40px 12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#fff',
                appearance: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="JMD">JMD - Jamaican Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
            <DollarSign size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px', opacity: settings.tax_enabled ? 1 : 0.6 }}>
        <h2 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={20} />
          Category Tax Exemptions
        </h2>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
          Select categories that should be <strong>exempt from tax</strong>. Unchecked categories will have tax applied.
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {PRODUCT_CATEGORIES.map((category) => {
            const isExempt = settings.tax_exempt_categories.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                data-testid={`category-${category.id}`}
                onClick={() => settings.tax_enabled && toggleCategoryExemption(category.id)}
                disabled={!settings.tax_enabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  border: `2px solid ${isExempt ? '#8b5cf6' : '#e5e7eb'}`,
                  borderRadius: '10px',
                  backgroundColor: isExempt ? '#f5f3ff' : '#fff',
                  cursor: settings.tax_enabled ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: isExempt ? '#7c3aed' : '#374151',
                    marginBottom: '2px'
                  }}>
                    {category.label}
                    {isExempt && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        padding: '2px 8px',
                        backgroundColor: '#8b5cf6',
                        color: '#fff',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        TAX EXEMPT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {category.description}
                  </div>
                </div>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: `2px solid ${isExempt ? '#8b5cf6' : '#d1d5db'}`,
                  backgroundColor: isExempt ? '#8b5cf6' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isExempt && <Check size={14} color="#fff" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px', backgroundColor: '#f9fafb' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '12px' }}>
          Tax Configuration Preview
        </h3>
        {!settings.tax_enabled ? (
          <p style={{ fontSize: '15px', color: '#374151' }} data-testid="tax-preview">
            Tax is <strong>disabled</strong> - no tax will be applied to any sales
          </p>
        ) : (
          <div data-testid="tax-preview">
            <p style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
              Tax Rate: <strong>{settings.tax_rate}%</strong>
            </p>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
              <span style={{ color: '#059669' }}>✓ Taxable:</span>{' '}
              {taxableCategories.length > 0
                ? taxableCategories.map(c => c.label).join(', ')
                : 'None'}
            </p>
            <p style={{ fontSize: '14px', color: '#374151' }}>
              <span style={{ color: '#dc2626' }}>✗ Tax Exempt:</span>{' '}
              {settings.tax_exempt_categories.length > 0
                ? PRODUCT_CATEGORIES
                    .filter(c => settings.tax_exempt_categories.includes(c.id))
                    .map(c => c.label)
                    .join(', ')
                : 'None'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default TaxTab;
