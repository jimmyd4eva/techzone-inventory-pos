import React from 'react';
import { Shield, RefreshCw, Download, Monitor, Trash2 } from 'lucide-react';

export const DevicesTab = ({
  devices,
  loadingDevices,
  revokingDevice,
  fetchDevices,
  handleRevokeDevice,
  exportDevices
}) => {
  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Shield size={20} />
          Activated Devices
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchDevices}
            disabled={loadingDevices}
            data-testid="refresh-devices-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            <RefreshCw size={14} className={loadingDevices ? 'animate-spin' : ''} />
            Refresh
          </button>
          {devices.length > 0 && (
            <button
              onClick={exportDevices}
              data-testid="export-devices-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
        Manage devices that have been activated with this software. Revoking a device will require the user to re-activate.
      </p>

      {loadingDevices ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading devices...</p>
        </div>
      ) : devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <Monitor size={40} style={{ color: '#9ca3af', marginBottom: '12px' }} />
          <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>No Activated Devices</p>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>Devices will appear here once activated</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {devices.map((device) => (
            <div
              key={device.id || device.device_id}
              data-testid={`device-row-${device.device_id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '10px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Monitor size={16} style={{ color: '#8b5cf6' }} />
                  <span style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    backgroundColor: '#e5e7eb',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: '#374151'
                  }}>
                    {device.device_id}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#374151', marginBottom: '2px' }}>
                  <strong>Email:</strong> {device.activated_email}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Activated: {new Date(device.activated_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleRevokeDevice(device.device_id)}
                disabled={revokingDevice === device.device_id}
                data-testid={`revoke-device-${device.device_id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: revokingDevice === device.device_id ? '#fecaca' : '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: revokingDevice === device.device_id ? 'not-allowed' : 'pointer',
                  opacity: revokingDevice === device.device_id ? 0.7 : 1
                }}
              >
                <Trash2 size={14} />
                {revokingDevice === device.device_id ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
      )}

      {devices.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#faf5ff',
          borderRadius: '8px',
          display: 'flex',
          gap: '24px'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>{devices.length}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Devices</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
              {new Set(devices.map(d => d.activated_email)).size}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Unique Emails</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesTab;
