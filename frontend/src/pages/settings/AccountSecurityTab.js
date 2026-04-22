import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Monitor, LogOut, RefreshCw, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Friendly device/browser guess from the User-Agent string.
const prettyUA = (ua) => {
  if (!ua) return 'Unknown device';
  const os = /Windows/i.test(ua) ? 'Windows' :
    /iPhone|iOS/i.test(ua) ? 'iPhone' :
    /iPad/i.test(ua) ? 'iPad' :
    /Mac/i.test(ua) ? 'macOS' :
    /Android/i.test(ua) ? 'Android' :
    /Linux/i.test(ua) ? 'Linux' : 'Unknown OS';
  const browser =
    /Edg\//i.test(ua) ? 'Edge' :
    /Chrome\//i.test(ua) ? 'Chrome' :
    /Firefox\//i.test(ua) ? 'Firefox' :
    /Safari\//i.test(ua) && !/Chrome/i.test(ua) ? 'Safari' :
    /curl/i.test(ua) ? 'curl' : 'Browser';
  return `${browser} on ${os}`;
};

const timeAgo = (iso) => {
  if (!iso) return '—';
  try {
    const then = new Date(iso);
    const diffSec = Math.max(0, (Date.now() - then.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return iso;
  }
};

export const AccountSecurityTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/auth/sessions`);
      setSessions(r.data || []);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Failed to load sessions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id, isCurrent) => {
    if (isCurrent && !window.confirm('This will sign you out of this browser. Continue?')) return;
    setRevoking(id);
    setMessage(null);
    try {
      await axios.post(`${API}/auth/sessions/${id}/revoke`);
      setMessage({ type: 'success', text: 'Session revoked.' });
      if (isCurrent) {
        // the cookie is now pointing at a dead jti; reload will bounce to login
        setTimeout(() => { window.location.href = '/login'; }, 800);
        return;
      }
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Failed to revoke' });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div data-testid="account-security-tab" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ padding: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#7c3aed" />
            Recent Sign-ins
          </h3>
          <button
            type="button"
            data-testid="refresh-sessions-btn"
            onClick={load}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', background: '#f3f4f6', color: '#374151',
              border: '1px solid #e5e7eb', borderRadius: '6px',
              fontSize: '12px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={12} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px 0' }}>
          Every successful login is recorded here so you can spot unfamiliar activity. Click <b>Sign out</b> on any suspicious row to invalidate that session immediately — the next request from it will be rejected.
        </p>

        {message ? (
          <div style={{
            padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
          }} data-testid="session-msg">{message.text}</div>
        ) : null}

        {loading ? (
          <div style={{ color: '#6b7280', fontSize: '13px' }}>Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '13px' }}>No recorded sessions yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Device / Browser', 'IP', 'Signed in', 'Duration', 'Status', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const isRevoked = !!s.revoked_at;
                  return (
                    <tr
                      key={s.id}
                      data-testid={`session-row-${s.id}`}
                      style={{ borderBottom: '1px solid #f3f4f6', opacity: isRevoked ? 0.55 : 1 }}
                    >
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Monitor size={14} color="#6b7280" />
                          <div>
                            <div style={{ fontWeight: 500, color: '#111827' }}>{prettyUA(s.user_agent)}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }} title={s.user_agent}>{(s.user_agent || '').slice(0, 50)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>{s.ip || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{timeAgo(s.created_at)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>
                        {s.remember_me ? '30 days' : '24 hours'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {isRevoked ? (
                          <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', background: '#fee2e2', color: '#991b1b' }}>Revoked</span>
                        ) : s.is_current ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', background: '#d1fae5', color: '#065f46' }}>
                            <Check size={11} /> This browser
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', background: '#e0e7ff', color: '#4338ca' }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {isRevoked ? null : (
                          <button
                            type="button"
                            data-testid={`revoke-session-${s.id}`}
                            onClick={() => revoke(s.id, s.is_current)}
                            disabled={revoking === s.id}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '4px 10px', background: s.is_current ? '#fff' : '#dc2626', color: s.is_current ? '#dc2626' : '#fff',
                              border: s.is_current ? '1px solid #fecaca' : 'none',
                              borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                              cursor: revoking === s.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <LogOut size={11} /> {revoking === s.id ? 'Revoking…' : 'Sign out'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSecurityTab;
