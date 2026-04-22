import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Download, Upload, Database, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * A tiny "disaster-ready" panel for POS owners: one click to download a
 * timestamped zip of every collection in the Mongo database. Works on:
 *   - cloud preview/prod (no shell access needed)
 *   - portable Windows build (no `mongodump` binary needed)
 * because the backend streams an in-memory zip built from live queries.
 */
export const DataBackupTab = () => {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState(null);
  const [lastBackupAt, setLastBackupAt] = useState(
    localStorage.getItem('last_backup_at') || null
  );
  const fileRef = useRef(null);

  const handleRestore = async (event) => {
    const f = event.target.files?.[0];
    if (!f) return;
    // Deliberately scary confirmation — this action is irreversible.
    const go = window.confirm(
      `This will REPLACE the current database with the contents of "${f.name}".\n\n` +
      'Every customer, sale, repair and setting will be overwritten. You may be ' +
      'signed out after the restore completes.\n\n' +
      'Have you taken a fresh backup first? Click OK only if you are sure.'
    );
    if (!go) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setRestoring(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append('file', f);
      const r = await axios.post(`${API}/admin/restore`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const restored = r.data?.total_restored ?? 0;
      const collCount = Object.keys(r.data?.collections || {}).length;
      setMsg({
        type: 'success',
        text: `Restore complete — ${restored} documents across ${collCount} collections. Signing you out so you can log in with the restored credentials…`,
      });
      setTimeout(() => {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 2200);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Restore failed. Your data is unchanged.' });
    } finally {
      setRestoring(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setMsg(null);
    try {
      const response = await axios.get(`${API}/admin/backup`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `techzone-backup-${ts}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      const now = new Date().toISOString();
      localStorage.setItem('last_backup_at', now);
      setLastBackupAt(now);
      setMsg({ type: 'success', text: 'Backup downloaded. Store the zip somewhere safe (external drive, cloud).' });
    } catch (e) {
      setMsg({
        type: 'error',
        text: e.response?.status === 403
          ? 'Only admins can download a backup.'
          : (e.response?.data?.detail || 'Backup failed. Please try again.'),
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div data-testid="data-backup-tab" style={{ padding: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Database size={18} color="#7c3aed" />
        Data & Backup
      </h3>
      <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 18px 0' }}>
        Download a complete snapshot of every sale, customer, repair, coupon, and setting as a single ZIP file. Keep one copy on an external drive or cloud storage — this is your safety net against a hard-drive failure or ransomware.
      </p>

      <div style={{
        padding: '14px 16px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px',
        marginBottom: '18px', fontSize: '13px', color: '#581c87', display: 'flex', gap: '10px',
      }}>
        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <b>Recommended:</b> back up weekly, and <b>always</b> before upgrading the app or moving to a new PC.
          The zip contains one <code>.json</code> file per collection plus a <code>_manifest.json</code>.
        </div>
      </div>

      <button
        type="button"
        data-testid="download-backup-btn"
        onClick={handleDownload}
        disabled={downloading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px', background: downloading ? '#a78bfa' : '#7c3aed', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
          cursor: downloading ? 'not-allowed' : 'pointer',
        }}
      >
        <Download size={16} /> {downloading ? 'Preparing zip…' : 'Download backup (.zip)'}
      </button>

      {lastBackupAt ? (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={12} color="#059669" />
          Last backup from this browser: {new Date(lastBackupAt).toLocaleString()}
        </div>
      ) : null}

      {msg ? (
        <div
          data-testid="backup-msg"
          style={{
            marginTop: '14px', padding: '10px 14px', borderRadius: '6px', fontSize: '13px',
            background: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: msg.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {msg.text}
        </div>
      ) : null}

      {/* ----- Restore from backup (danger zone) ----- */}
      <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px dashed #e5e7eb' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={16} />
          Danger zone · Restore from backup
        </h4>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 14px 0' }}>
          Pick a <code>.zip</code> produced by the Download button above. Every collection it contains will be <b>replaced</b> — current data will be lost. You will be signed out afterwards so you can log in with the restored credentials.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          onChange={handleRestore}
          disabled={restoring}
          style={{ display: 'none' }}
          data-testid="restore-file-input"
        />
        <button
          type="button"
          data-testid="restore-backup-btn"
          onClick={() => fileRef.current?.click()}
          disabled={restoring}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', background: '#fff', color: '#b91c1c',
            border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: restoring ? 'not-allowed' : 'pointer',
          }}
        >
          <Upload size={14} /> {restoring ? 'Restoring…' : 'Restore from .zip'}
        </button>
      </div>
    </div>
  );
};

export default DataBackupTab;
