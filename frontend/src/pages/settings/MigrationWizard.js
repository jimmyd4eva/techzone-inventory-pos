import React, { useState } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, Download, Package, Upload, CheckCircle2, Copy, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * 3-step wizard that walks a non-technical owner through moving their POS
 * to a new PC. Reuses the encryption + restore-preview endpoints already
 * shipped — this is purely a curated UX layer on top.
 *
 *   Step 1 (on the OLD PC): take an encrypted backup
 *   Step 2 (on the NEW PC): install the portable build
 *   Step 3 (on the NEW PC): restore with preview
 *
 * The wizard remembers state across the 3 steps via component state — no
 * server round-trips except for the actual download / restore.
 */
export const MigrationWizard = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadOk, setDownloadOk] = useState(false);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [diff, setDiff] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);

  // Step 1 — download encrypted backup --------------------------------------
  const downloadEncrypted = async () => {
    setError(null);
    if (passphrase.length < 12) {
      setError('Use a passphrase of at least 12 characters — this is the only key to your data.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('The two passphrases do not match.');
      return;
    }
    setDownloading(true);
    try {
      const r = await axios.get(`${API}/admin/backup?passphrase=${encodeURIComponent(passphrase)}`, { responseType: 'blob' });
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const blob = new Blob([r.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `techzone-migration-${ts}.zip.tzbk`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloadOk(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Backup download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Step 3 — restore with preview ------------------------------------------
  const onRestoreFilePick = async (event) => {
    const f = event.target.files?.[0];
    if (!f) return;
    setError(null);
    setRestoring(true);
    try {
      const form = new FormData();
      form.append('file', f);
      if (passphrase) form.append('passphrase', passphrase);
      const r = await axios.post(`${API}/admin/restore/preview`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRestoreFile(f);
      setDiff(r.data?.diff || []);
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not read backup file.');
    } finally {
      setRestoring(false);
    }
  };

  const commitRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', restoreFile);
      if (passphrase) form.append('passphrase', passphrase);
      const r = await axios.post(`${API}/admin/restore`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const restored = r.data?.total_restored ?? 0;
      // Sign out so the user logs in with restored credentials.
      setTimeout(() => {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 1800);
      setStep(4);
      setDiff({ done: true, restored });
    } catch (e) {
      setError(e.response?.data?.detail || 'Restore failed. Your data is unchanged.');
    } finally {
      setRestoring(false);
    }
  };

  // Render --------------------------------------------------------------
  return (
    <div
      data-testid="migration-wizard-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%', maxWidth: '620px', maxHeight: '88vh', overflowY: 'auto',
          background: '#fff', borderRadius: '14px', padding: '24px 28px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.3)', position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#64748b', padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Migrate to a new PC</h3>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 18px 0' }}>
          A guided 3-step transfer of all your POS data to another Windows machine — typically takes 10–15 minutes.
        </p>

        {/* Stepper */}
        <Stepper step={step} />

        {error ? (
          <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>
            {error}
          </div>
        ) : null}

        {step === 1 && (
          <Step1
            passphrase={passphrase}
            setPassphrase={setPassphrase}
            confirmPassphrase={confirmPassphrase}
            setConfirmPassphrase={setConfirmPassphrase}
            downloadOk={downloadOk}
            downloading={downloading}
            onDownload={downloadEncrypted}
            onNext={() => { setStep(2); }}
          />
        )}
        {step === 2 && (
          <Step2
            passphrase={passphrase}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            diff={diff}
            restoring={restoring}
            onPick={onRestoreFilePick}
            onCommit={commitRestore}
            onBack={() => { setDiff(null); setRestoreFile(null); setStep(2); }}
          />
        )}
        {step === 4 && (
          <Step4 restored={diff?.restored} />
        )}
      </div>
    </div>
  );
};

const Stepper = ({ step }) => {
  const items = ['Backup', 'Install', 'Restore', 'Done'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
      {items.map((label, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <React.Fragment key={label}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                color: done ? '#059669' : active ? '#7c3aed' : '#9ca3af',
                fontSize: '12px', fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#d1fae5' : active ? '#ede9fe' : '#f3f4f6',
                  fontSize: '12px',
                }}
              >
                {done ? '✓' : idx}
              </span>
              {label}
            </div>
            {i < items.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ----- Step components ------------------------------------------------

const Step1 = ({ passphrase, setPassphrase, confirmPassphrase, setConfirmPassphrase, downloadOk, downloading, onDownload, onNext }) => (
  <div>
    <h4 style={{ margin: 0, fontSize: '14px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Download size={15} /> Step 1 — Take an encrypted backup (on this PC)
    </h4>
    <p style={{ fontSize: '13px', color: '#374151', margin: '8px 0 14px 0' }}>
      Choose a strong passphrase (at least 12 characters). The backup file is encrypted — without this passphrase, your data <b>cannot</b> be restored. Write it down somewhere safe.
    </p>
    <input
      type="password"
      data-testid="wizard-pass-input"
      placeholder="Passphrase (≥ 12 characters)"
      value={passphrase}
      onChange={(e) => setPassphrase(e.target.value)}
      autoComplete="new-password"
      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', marginBottom: '8px' }}
    />
    <input
      type="password"
      data-testid="wizard-confirm-input"
      placeholder="Confirm passphrase"
      value={confirmPassphrase}
      onChange={(e) => setConfirmPassphrase(e.target.value)}
      autoComplete="new-password"
      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
    />
    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
      <button
        type="button"
        data-testid="wizard-download-btn"
        onClick={onDownload}
        disabled={downloading}
        style={{
          padding: '9px 16px',
          background: downloading ? '#a78bfa' : '#7c3aed',
          color: '#fff', border: 'none', borderRadius: '8px',
          fontSize: '13px', fontWeight: 600,
          cursor: downloading ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}
      >
        <Download size={14} /> {downloading ? 'Preparing…' : 'Download encrypted backup'}
      </button>
      {downloadOk ? (
        <button
          type="button"
          data-testid="wizard-step1-next"
          onClick={onNext}
          style={{
            padding: '9px 16px', background: '#059669', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}
        >
          Next <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
    {downloadOk ? (
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <CheckCircle2 size={14} /> Backup saved. Copy the file (and your passphrase) to a USB drive or cloud storage you can access from the new PC.
      </div>
    ) : null}
  </div>
);

const Step2 = ({ passphrase, onBack, onNext }) => {
  const [copied, setCopied] = useState(false);
  const copyPassphrase = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(passphrase).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div>
      <h4 style={{ margin: 0, fontSize: '14px', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Package size={15} /> Step 2 — Install on the NEW PC
      </h4>
      <p style={{ fontSize: '13px', color: '#374151', margin: '8px 0 14px 0' }}>
        On the new computer, install the TechZone POS portable build:
      </p>
      <ol style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, paddingLeft: '20px' }}>
        <li>Copy <code>TechZone-Portable-1.1.0.zip</code> (or the EXE installer) onto the new PC.</li>
        <li>Unzip it anywhere — for example <code>C:\POS\</code>.</li>
        <li>Double-click <code>START.bat</code>. The browser will open at <code>http://127.0.0.1:8001</code>.</li>
        <li>Log in with the default <b>admin / admin123</b>. (You'll log in with your real credentials after the restore.)</li>
        <li>Open <b>Settings → Backup → Migrate to a new PC</b> on the new PC and skip directly to step 3.</li>
      </ol>
      <div style={{ marginTop: '12px', padding: '10px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e' }}>
        ⚠️ <b>You'll need your passphrase</b> on the new PC to decrypt the backup.
        {passphrase ? (
          <button
            type="button"
            onClick={copyPassphrase}
            style={{
              marginLeft: '8px', padding: '3px 8px', background: '#fff',
              border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '11px',
              cursor: 'pointer', color: '#92400e', fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}
          >
            <Copy size={11} /> {copied ? 'Copied' : 'Copy to clipboard'}
          </button>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '9px 16px', background: '#f3f4f6', color: '#374151',
            border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          data-testid="wizard-step2-next"
          onClick={onNext}
          style={{
            padding: '9px 16px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}
        >
          On new PC, ready to restore <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

const Step3 = ({ diff, restoring, onPick, onCommit, onBack }) => (
  <div>
    <h4 style={{ margin: 0, fontSize: '14px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Upload size={15} /> Step 3 — Restore on the NEW PC
    </h4>
    <p style={{ fontSize: '13px', color: '#374151', margin: '8px 0 14px 0' }}>
      Pick the <code>.zip.tzbk</code> file you downloaded in step 1. We'll decrypt it, show you a preview of the changes, then ask you to confirm before applying.
    </p>
    {!diff ? (
      <label
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '9px 16px', background: '#fff', color: '#b91c1c',
          border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, cursor: restoring ? 'not-allowed' : 'pointer',
          opacity: restoring ? 0.6 : 1,
        }}
      >
        <Upload size={14} /> {restoring ? 'Reading…' : 'Pick backup file'}
        <input
          type="file"
          data-testid="wizard-restore-input"
          accept=".zip,.tzbk,application/zip,application/octet-stream"
          onChange={onPick}
          disabled={restoring}
          style={{ display: 'none' }}
        />
      </label>
    ) : (
      <>
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
              {diff.map((row) => {
                const tone = row.delta > 0 ? '#059669' : row.delta < 0 ? '#dc2626' : '#6b7280';
                return (
                  <tr key={row.collection} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 12px', fontFamily: 'monospace' }}>{row.collection}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>{row.current}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right' }}>{row.incoming}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', color: tone, fontWeight: 600 }}>
                      {row.delta > 0 ? `+${row.delta}` : row.delta}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    )}
    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          padding: '9px 16px', background: '#f3f4f6', color: '#374151',
          border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>
      {diff ? (
        <button
          type="button"
          data-testid="wizard-commit-btn"
          onClick={onCommit}
          disabled={restoring}
          style={{
            padding: '9px 16px', background: '#dc2626', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: restoring ? 'not-allowed' : 'pointer',
          }}
        >
          {restoring ? 'Applying…' : 'Apply restore'}
        </button>
      ) : null}
    </div>
  </div>
);

const Step4 = ({ restored }) => (
  <div style={{ textAlign: 'center', padding: '20px 10px' }}>
    <CheckCircle2 size={42} color="#059669" style={{ marginBottom: '8px' }} />
    <h4 style={{ margin: 0, fontSize: '16px', color: '#065f46' }}>Migration complete</h4>
    <p style={{ fontSize: '13px', color: '#374151', margin: '8px 0 0 0' }}>
      Restored {restored ?? 0} documents. Signing you out so you can log in with your original credentials…
    </p>
  </div>
);

export default MigrationWizard;
