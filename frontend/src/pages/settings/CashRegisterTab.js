import React, { useState } from 'react';
import axios from 'axios';
import {
  Wallet, DollarSign, Plus, Minus, Clock, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, FileText, Send, CalendarRange
} from 'lucide-react';
import { Switch } from '../../components/ui/switch';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AutoSummaryCard = ({ settings, setSettings }) => {
  const [sending, setSending] = useState(null); // 'weekly' | 'monthly' | null
  const [msg, setMsg] = useState({ type: '', text: '' });

  const sendNow = async (period) => {
    setSending(period);
    setMsg({ type: '', text: '' });
    try {
      const r = await axios.post(
        `${API}/reports/send-summary-now`,
        { period }
      );
      if (r.data.sent) {
        setMsg({ type: 'success', text: `${period === 'weekly' ? 'Weekly' : 'Monthly'} summary sent to ${r.data.recipient}` });
      } else {
        setMsg({ type: 'error', text: 'Email service unavailable (check EMAIL_PASSWORD).' });
      }
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.detail || 'Failed to send summary' });
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{
        marginBottom: '16px', fontSize: '16px', fontWeight: '600',
        color: '#374151', display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <CalendarRange size={18} />
        Auto-Email Sales &amp; Tax Summaries
      </h3>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        A PDF summary (revenue, tax collected, daily breakdown) is emailed to your Manager Email above.
        Weekly runs Monday covering the prior Mon–Sun. Monthly runs on the 1st covering the prior calendar month.
      </p>

      {msg.text && (
        <div
          data-testid="auto-summary-message"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            marginBottom: '12px',
            backgroundColor: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: msg.type === 'success' ? '#065f46' : '#991b1b'
          }}
        >
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Weekly Summary (every Monday)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => sendNow('weekly')}
            disabled={sending === 'weekly'}
            data-testid="send-weekly-summary-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', fontSize: '12px', fontWeight: '600',
              color: '#fff', backgroundColor: '#8b5cf6',
              border: 'none', borderRadius: '6px',
              cursor: sending === 'weekly' ? 'not-allowed' : 'pointer',
              opacity: sending === 'weekly' ? 0.7 : 1
            }}
          >
            <Send size={12} /> {sending === 'weekly' ? 'Sending...' : 'Send Now'}
          </button>
          <Switch
            data-testid="auto-summary-weekly-toggle"
            checked={settings.auto_summary_weekly_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, auto_summary_weekly_enabled: checked })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          Monthly Summary (1st of every month)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => sendNow('monthly')}
            disabled={sending === 'monthly'}
            data-testid="send-monthly-summary-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', fontSize: '12px', fontWeight: '600',
              color: '#fff', backgroundColor: '#8b5cf6',
              border: 'none', borderRadius: '6px',
              cursor: sending === 'monthly' ? 'not-allowed' : 'pointer',
              opacity: sending === 'monthly' ? 0.7 : 1
            }}
          >
            <Send size={12} /> {sending === 'monthly' ? 'Sending...' : 'Send Now'}
          </button>
          <Switch
            data-testid="auto-summary-monthly-toggle"
            checked={settings.auto_summary_monthly_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, auto_summary_monthly_enabled: checked })}
          />
        </div>
      </div>
    </div>
  );
};

export const CashRegisterTab = ({
  settings,
  setSettings,
  currentShift,
  shiftTransactions,
  shiftTotals,
  shiftHistory,
  loadingRegister,
  openingAmount,
  setOpeningAmount,
  closingAmount,
  setClosingAmount,
  closingNotes,
  setClosingNotes,
  transactionAmount,
  setTransactionAmount,
  transactionType,
  setTransactionType,
  transactionDesc,
  setTransactionDesc,
  showHistory,
  setShowHistory,
  handleOpenShift,
  handleCloseShift,
  handleAddTransaction,
  exportShiftReport
}) => {
  return (
    <div>
      {loadingRegister ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading cash register...</p>
        </div>
      ) : !currentShift ? (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} />
            Open Cash Register
          </h2>

          <div style={{
            backgroundColor: '#fef3c7',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fcd34d',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', margin: '0 0 4px 0' }}>
                No Shift Currently Open
              </p>
              <p style={{ fontSize: '13px', color: '#a16207', margin: 0 }}>
                Open a shift to start tracking cash transactions. Cash sales will only be recorded when a shift is open.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Opening Cash Amount (Float)
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="Enter starting cash amount"
                data-testid="opening-amount-input"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Count the cash in the drawer before starting your shift
            </p>
          </div>

          <button
            onClick={handleOpenShift}
            data-testid="open-shift-btn"
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            Open Shift
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Wallet size={20} />
                Current Shift
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => exportShiftReport(currentShift.id)}
                  data-testid="export-current-shift-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={14} />
                  Export PDF
                </button>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: '#d1fae5',
                  color: '#059669',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle size={14} />
                  OPEN
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '140px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#059669', marginBottom: '4px', fontWeight: '500' }}>Opening Float</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#047857' }}>${(shiftTotals.opening_amount || 0).toFixed(2)}</div>
              </div>
              <div style={{ flex: '1', minWidth: '140px', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px', fontWeight: '500' }}>Cash Sales</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>+${(shiftTotals.cash_sales || 0).toFixed(2)}</div>
              </div>
              <div style={{ flex: '1', minWidth: '140px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#d97706', marginBottom: '4px', fontWeight: '500' }}>Payouts</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#b45309' }}>-${(shiftTotals.payouts || 0).toFixed(2)}</div>
              </div>
              <div style={{ flex: '1', minWidth: '140px', padding: '16px', backgroundColor: '#fae8ff', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#a855f7', marginBottom: '4px', fontWeight: '500' }}>Expected Cash</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#9333ea' }}>${(shiftTotals.expected_amount || 0).toFixed(2)}</div>
              </div>
            </div>

            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Opened by <strong>{currentShift.opened_by_name}</strong> at {new Date(currentShift.opened_at).toLocaleString()}
            </div>
          </div>

          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Record Transaction
            </h3>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '120px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Type</label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  data-testid="transaction-type-select"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="payout">Payout (Cash Out)</option>
                  <option value="drop">Safe Drop</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              <div style={{ flex: '1', minWidth: '120px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                  placeholder="0.00"
                  data-testid="transaction-amount-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ flex: '2', minWidth: '180px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>Description</label>
                <input
                  type="text"
                  value={transactionDesc}
                  onChange={(e) => setTransactionDesc(e.target.value)}
                  placeholder="e.g., Petty cash for supplies"
                  data-testid="transaction-desc-input"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleAddTransaction}
              data-testid="add-transaction-btn"
              style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              Record Transaction
            </button>
          </div>

          {shiftTransactions.length > 0 && (
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                Shift Transactions ({shiftTransactions.length})
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {shiftTransactions.map((t, i) => (
                  <div key={t.id || i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: i % 2 === 0 ? '#f9fafb' : '#fff',
                    borderRadius: '6px',
                    marginBottom: '4px'
                  }}>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: t.transaction_type === 'cash_sale' ? '#d1fae5' : t.transaction_type === 'payout' ? '#fef3c7' : t.transaction_type === 'drop' ? '#dbeafe' : '#fee2e2',
                        color: t.transaction_type === 'cash_sale' ? '#059669' : t.transaction_type === 'payout' ? '#d97706' : t.transaction_type === 'drop' ? '#3b82f6' : '#dc2626',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        marginRight: '8px',
                        textTransform: 'uppercase'
                      }}>
                        {t.transaction_type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{t.description || '-'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: t.amount > 0 ? '#059669' : '#dc2626'
                      }}>
                        {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {new Date(t.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '24px', marginBottom: '24px', border: '2px solid #dc2626' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Minus size={18} />
              Close Shift
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Actual Cash Count
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="Count the cash in drawer"
                  data-testid="closing-amount-input"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Expected: <strong>${(shiftTotals.expected_amount || 0).toFixed(2)}</strong>
                {closingAmount && (
                  <span style={{
                    marginLeft: '12px',
                    color: parseFloat(closingAmount) === shiftTotals.expected_amount ? '#059669' : '#dc2626',
                    fontWeight: '600'
                  }}>
                    {parseFloat(closingAmount) > shiftTotals.expected_amount ? 'OVER' : parseFloat(closingAmount) < shiftTotals.expected_amount ? 'SHORT' : 'BALANCED'}
                    {' '}by ${Math.abs(parseFloat(closingAmount || 0) - shiftTotals.expected_amount).toFixed(2)}
                  </span>
                )}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                Notes (Optional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Any notes about discrepancies or issues..."
                data-testid="closing-notes-input"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              onClick={handleCloseShift}
              data-testid="close-shift-btn"
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Minus size={20} />
              Close Shift
            </button>
          </div>
        </>
      )}

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} />
          Auto-Email Shift Reports
        </h3>

        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          Automatically send shift reports to a manager when shifts are closed.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Enable Auto-Email Reports
            </span>
            <Switch
              data-testid="shift-report-email-toggle"
              checked={settings.shift_report_email_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, shift_report_email_enabled: checked })}
            />
          </div>
        </div>

        {settings.shift_report_email_enabled && (
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
              Manager Email Address
            </label>
            <input
              type="email"
              value={settings.shift_report_email}
              onChange={(e) => setSettings({ ...settings, shift_report_email: e.target.value })}
              placeholder="manager@example.com"
              data-testid="shift-report-email-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              PDF report will be emailed when any shift is closed
            </p>
          </div>
        )}

        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '12px',
          borderRadius: '8px',
          marginTop: '16px',
          border: '1px solid #86efac'
        }}>
          <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>
            <strong>Note:</strong> Don't forget to click "Save Settings" at the bottom of the page to apply email settings.
          </p>
        </div>
      </div>

      <AutoSummaryCard settings={settings} setSettings={setSettings} />

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Clock size={18} />
            Shift History
          </h3>
          {showHistory ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
        </button>

        {showHistory && (
          <div style={{ marginTop: '16px' }}>
            {shiftHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No closed shifts yet</p>
            ) : (
              shiftHistory.map((shift, i) => (
                <div key={shift.id || i} style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        {new Date(shift.opened_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {shift.opened_by_name} → {shift.closed_by_name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => exportShiftReport(shift.id)}
                        data-testid={`export-shift-${shift.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        title="Export PDF Report"
                      >
                        <FileText size={12} />
                        PDF
                      </button>
                      <span style={{
                        padding: '4px 10px',
                        backgroundColor: shift.difference === 0 ? '#d1fae5' : shift.difference > 0 ? '#dbeafe' : '#fee2e2',
                        color: shift.difference === 0 ? '#059669' : shift.difference > 0 ? '#3b82f6' : '#dc2626',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {shift.difference === 0 ? 'BALANCED' : shift.difference > 0 ? `+$${shift.difference.toFixed(2)} OVER` : `-$${Math.abs(shift.difference).toFixed(2)} SHORT`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                    <span>Open: ${shift.opening_amount.toFixed(2)}</span>
                    <span>Expected: ${shift.expected_amount?.toFixed(2) || '0.00'}</span>
                    <span>Actual: ${shift.closing_amount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashRegisterTab;
