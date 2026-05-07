import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, Upload, Database, AlertCircle, CheckCircle2, AlertTriangle, Mail, Calendar, Rocket } from 'lucide-react';
import { MigrationWizard } from './MigrationWizard';

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

  // Auto-backup settings
  const [autoCfg, setAutoCfg] = useState({
    auto_backup_enabled: false,
    auto_backup_email: '',
    auto_backup_frequency: 'weekly',
    auto_backup_last_sent: null,
  });
  const [savingCfg, setSavingCfg] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API}/settings`);
        if (cancelled) return;
        setAutoCfg({
          auto_backup_enabled: !!r.data.auto_backup_enabled,
          auto_backup_email: r.data.auto_backup_email || r.data.shift_report_email || '',
          auto_backup_frequency: r.data.auto_backup_frequency || 'weekly',
          auto_backup_last_sent: r.data.auto_backup_last_sent || null,
        });
      } catch (e) {
        // Settings endpoint failure is non-fatal — the rest of the panel still works.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveAutoCfg = async (overrides = {}) => {
    setSavingCfg(true);
    setMsg(null);
    try {
      const merged = { ...autoCfg, ...overrides };
      // Pull current settings, merge our 3 keys, save back.
      const r = await axios.get(`${API}/settings`);
      const next = {
        ...r.data,
        auto_backup_enabled: merged.auto_backup_enabled,
        auto_backup_email: merged.auto_backup_email,
        auto_backup_frequency: merged.auto_backup_frequency,
      };
      await axios.put(`${API}/settings`, next);
      setAutoCfg(merged);
      setMsg({ type: 'success', text: 'Auto-backup settings saved.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Could not save auto-backup settings.' });
    } finally {
      setSavingCfg(false);
    }
  };

  const sendBackupNow = async () => {
    setSendingNow(true);
    setMsg(null);
    try {
      const r = await axios.post(`${API}/admin/backup/send-now`);
      if (r.data.sent) {
        setMsg({ type: 'success', text: `Backup emailed to ${r.data.recipient} (${(r.data.size_bytes / 1024).toFixed(1)} KB).` });
        setAutoCfg((c) => ({ ...c, auto_backup_last_sent: new Date().toISOString() }));
      } else {
        setMsg({ type: 'error', text: 'Email send failed. Check SMTP credentials in backend .env.' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Could not send backup.' });
    } finally {
      setSendingNow(false);
    }
  };

  // --- Restore: two-step (preview → confirm-commit) with optional passphrase ---
  const [restorePending, setRestorePending] = useState(null); // { file, diff, encrypted, passphrase }

  const handleRestoreFile = async (event) => {
    const f = event.target.files?.[0];
    if (!f) return;
    setMsg(null);
    const isEncrypted = /\.tzbk$/i.test(f.name);
    let passphrase = '';
    if (isEncrypted) {
      passphrase = window.prompt(`"${f.name}" is encrypted. Enter the passphrase used when downloading it:`) || '';
      if (!passphrase) {
        if (fileRef.current) fileRef.current.value = '';
        return;
      }
    }
    setRestoring(true);
    try {
      const form = new FormData();
      form.append('file', f);
      if (passphrase) form.append('passphrase', passphrase);
      const r = await axios.post(`${API}/admin/restore/preview`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRestorePending({ file: f, diff: r.data?.diff || [], passphrase, encrypted: isEncrypted });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.detail || 'Could not read backup file.' });
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setRestoring(false);
    }
  };

  const commitRestore = async () => {
    if (!restorePending?.file) return;
    setRestoring(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append('file', restorePending.file);
      if (restorePending.passphrase) form.append('passphrase', restorePending.passphrase);
      const r = await axios.post(`${API}/admin/restore`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const restored = r.data?.total_restored ?? 0;
      const collCount = Object.keys(r.data?.collections || {}).length;
      setMsg({
        type: 'success',
        text: `Restore complete — ${restored} documents across ${collCount} collections. Signing you out so you can log in with the restored credentials…`,
      });
      setRestorePending(null);
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

  const cancelRestore = () => {
    setRestorePending(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // --- Optional encryption ---
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const handleDownload = async () => {
    if (usePassphrase && !passphrase) {
      setMsg({ type: 'error', text: 'Please enter a passphrase, or untick the encryption box.' });
      return;
    }
    setDownloading(true);
    setMsg(null);
    try {
      const url = usePassphrase
        ? `${API}/admin/backup?passphrase=${encodeURIComponent(passphrase)}`
        : `${API}/admin/backup`;
      const response = await axios.get(url, { responseType: 'blob' });
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const ext = usePassphrase ? 'zip.tzbk' : 'zip';
      const blob = new Blob([response.data], { type: usePassphrase ? 'application/octet-stream' : 'application/zip' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `techzone-backup-${ts}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      const now = new Date().toISOString();
      localStorage.setItem('last_backup_at', now);
      setLastBackupAt(now);
      setMsg({
        type: 'success',
        text: usePassphrase
          ? 'Encrypted backup downloaded. Save the passphrase somewhere safe — without it, the backup cannot be restored.'
          : 'Backup downloaded. Store the zip somewhere safe (external drive, cloud).',
      });
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

      <button
        type="button"
        data-testid="open-migration-wizard-btn"
        onClick={() => setShowWizard(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px', background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)',
          color: '#fff', border: 'none', borderRadius: '8px',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          marginBottom: '14px',
        }}
      >
        <Rocket size={14} /> Migrate to a new PC (3-step wizard)
      </button>

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
        <Download size={16} /> {downloading ? 'Preparing…' : 'Download backup'}
      </button>

      <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
          <input
            type="checkbox"
            data-testid="encrypt-backup-toggle"
            checked={usePassphrase}
            onChange={(e) => setUsePassphrase(e.target.checked)}
            style={{ width: '14px', height: '14px' }}
          />
          <b>Encrypt with passphrase (AES-256-GCM)</b>
        </label>
        {usePassphrase ? (
          <div style={{ marginTop: '8px' }}>
            <input
              type="password"
              data-testid="backup-passphrase-input"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Strong passphrase (≥ 12 characters recommended)"
              autoComplete="new-password"
              style={{
                width: '100%', maxWidth: '420px', padding: '8px 10px',
                border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px',
              }}
            />
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#92400e' }}>
              ⚠️ Without this passphrase the backup cannot be restored — there is no recovery.
            </div>
          </div>
        ) : null}
      </div>

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

      {/* ----- Scheduled auto-backup ----- */}
      <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px dashed #e5e7eb' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} /> Scheduled email backups
        </h4>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 14px 0' }}>
          Get a fresh backup zip emailed to you automatically. The scheduler runs hourly in the background and sends a backup whenever the chosen interval has elapsed.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              data-testid="auto-backup-enabled-toggle"
              checked={autoCfg.auto_backup_enabled}
              onChange={(e) => saveAutoCfg({ auto_backup_enabled: e.target.checked })}
              disabled={savingCfg}
              style={{ width: '16px', height: '16px' }}
            />
            <b>Enable auto-backup</b>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '560px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Frequency</label>
            <select
              data-testid="auto-backup-frequency-select"
              value={autoCfg.auto_backup_frequency}
              onChange={(e) => setAutoCfg((c) => ({ ...c, auto_backup_frequency: e.target.value }))}
              onBlur={() => saveAutoCfg()}
              disabled={savingCfg || !autoCfg.auto_backup_enabled}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Recipient email</label>
            <input
              type="email"
              data-testid="auto-backup-email-input"
              value={autoCfg.auto_backup_email}
              onChange={(e) => setAutoCfg((c) => ({ ...c, auto_backup_email: e.target.value }))}
              onBlur={() => saveAutoCfg()}
              disabled={savingCfg || !autoCfg.auto_backup_enabled}
              placeholder="owner@example.com"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
            />
          </div>
        </div>

        <button
          type="button"
          data-testid="send-backup-now-btn"
          onClick={sendBackupNow}
          disabled={sendingNow || !autoCfg.auto_backup_email}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: '#fff', color: '#1d4ed8',
            border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: (sendingNow || !autoCfg.auto_backup_email) ? 'not-allowed' : 'pointer',
            opacity: (sendingNow || !autoCfg.auto_backup_email) ? 0.6 : 1,
          }}
        >
          <Mail size={14} /> {sendingNow ? 'Sending…' : 'Send backup email now'}
        </button>

        {autoCfg.auto_backup_last_sent ? (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={12} color="#059669" />
            Last automatic email: {new Date(autoCfg.auto_backup_last_sent).toLocaleString()}
          </div>
        ) : null}
      </div>

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
          accept=".zip,.tzbk,application/zip,application/octet-stream"
          onChange={handleRestoreFile}
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
          <Upload size={14} /> {restoring ? 'Reading…' : 'Restore from .zip / .tzbk'}
        </button>
      </div>

      {/* Restore preview modal — shown after the user picks a file. */}
      {restorePending ? (
        <div
          data-testid="restore-preview-overlay"
          onClick={cancelRestore}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px', width: '92%', maxHeight: '80vh', overflowY: 'auto',
              background: '#fff', borderRadius: '12px', padding: '24px 28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '17px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Confirm restore from "{restorePending.file.name}"
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 16px 0' }}>
              The restore will <b>replace</b> every collection listed below. Review the deltas and click <i>Apply restore</i> to commit, or <i>Cancel</i> to abort.
            </p>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ textAlign: 'left',  padding: '8px 12px' }}>Collection</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Now</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Incoming</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {restorePending.diff.map((row) => {
                    const tone = row.delta > 0 ? '#059669' : row.delta < 0 ? '#dc2626' : '#6b7280';
                    return (
                      <tr key={row.collection} style={{ borderTop: '1px solid #f3f4f6' }} data-testid={`diff-row-${row.collection}`}>
                        <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: '#111827' }}>
                          {row.collection}
                          {row.protected ? <span style={{ marginLeft: 6, fontSize: 10, color: '#6366f1', fontWeight: 700 }}>PROTECTED</span> : null}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', color: '#374151' }}>{row.current}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', color: '#374151' }}>{row.incoming}</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', color: tone, fontWeight: 600 }}>
                          {row.delta > 0 ? `+${row.delta}` : row.delta}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#92400e' }}>
              ⚠️ This is irreversible. Take a fresh backup first if you're unsure.
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                data-testid="cancel-restore-btn"
                onClick={cancelRestore}
                disabled={restoring}
                style={{
                  padding: '8px 16px', background: '#fff', color: '#374151',
                  border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-restore-btn"
                onClick={commitRestore}
                disabled={restoring}
                style={{
                  padding: '8px 16px', background: '#dc2626', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '13px',
                  fontWeight: 600, cursor: restoring ? 'not-allowed' : 'pointer',
                }}
              >
                {restoring ? 'Applying…' : 'Apply restore'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showWizard ? (
        <MigrationWizard onClose={() => setShowWizard(false)} />
      ) : null}
    </div>
  );
};

export default DataBackupTab;
