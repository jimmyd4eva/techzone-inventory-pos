import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * App-wide safety net. Any render-time exception anywhere under this boundary
 * (e.g. a ReferenceError from a refactor that forgot to wire a prop) is
 * caught here instead of blanking the entire page.
 *
 * In dev the CRA red overlay still appears — that's a CRA-only feature. In
 * the production bundle (what users at emergent.host see) this friendly
 * panel takes over so a single broken modal can never white-screen the
 * whole POS app again.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to the browser console so the owner can still copy-paste into
    // a support ticket. We do NOT auto-report to a remote service — that
    // would be a surprise side effect for a local POS install.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught render error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    // Full nav so any in-memory bad state is discarded.
    window.location.href = '/';
  };

  render() {
    if (!this.state.error) return this.props.children;

    const msg = this.state.error?.message || 'Unknown error';
    return (
      <div
        data-testid="error-boundary-fallback"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
        }}
      >
        <div style={{
          maxWidth: '520px',
          width: '100%',
          padding: '28px 32px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '10px',
              background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={22} color="#dc2626" />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
              Something went wrong
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.55, margin: '0 0 16px 0' }}>
            A part of the app failed to render. Your data is safe — this is a
            display issue. Try reloading; if it happens again, copy the
            message below and send it to support.
          </p>
          <pre
            style={{
              fontSize: '12px',
              color: '#991b1b',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '10px 12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: '0 0 18px 0',
              maxHeight: '140px',
              overflow: 'auto',
            }}
          >{msg}</pre>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReload}
              data-testid="error-reload-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', background: '#7c3aed', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} /> Reload
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              data-testid="error-home-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', background: '#fff', color: '#374151',
                border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Home size={14} /> Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
