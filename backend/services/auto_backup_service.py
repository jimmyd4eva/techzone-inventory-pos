"""Auto-backup service.

Builds an in-memory ZIP of every Mongo collection (same logic the
`/api/admin/backup` endpoint exposes interactively) and emails it to the
configured recipient on a schedule. Designed to piggy-back on the existing
hourly scheduler in `services/scheduler.py` so we don't introduce a new
process/thread on the portable Windows build.

Settings keys (under db.settings, id=app_settings):
    auto_backup_enabled          : bool
    auto_backup_email            : str       (recipient — defaults to shift_report_email)
    auto_backup_frequency        : 'weekly' | 'monthly'   (default: weekly)
    auto_backup_last_sent        : ISO datetime — managed by this module

Files added:
    services/auto_backup_service.py   (this file)

Usage from scheduler.py:
    from services.auto_backup_service import maybe_send_backup
    await maybe_send_backup()
"""
import io
import json
import smtplib
import zipfile
from datetime import datetime, timezone, timedelta
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from bson import ObjectId

from core.config import (
    db, logger,
    EMAIL_ADDRESS, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT,
)


def _json_safe(v):
    """Coerce Mongo-flavoured types into JSON-serializable primitives."""
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, dict):
        return {k: _json_safe(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [_json_safe(x) for x in v]
    return v


async def _build_backup_zip() -> bytes:
    """Return a zip of every collection as JSON. Same shape as
    `/api/admin/backup` so the same restore endpoint can read it back.
    """
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for coll_name in await db.list_collection_names():
            docs = await db[coll_name].find({}, {"_id": 0}).to_list(length=None)
            zf.writestr(
                f"{coll_name}.json",
                json.dumps([_json_safe(d) for d in docs], indent=2, default=str),
            )
        manifest = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "exported_by": "auto-backup-scheduler",
            "schema_version": 1,
        }
        zf.writestr("_manifest.json", json.dumps(manifest, indent=2))
    buf.seek(0)
    return buf.read()


def _send_backup_email(to_email: str, zip_bytes: bytes, business_name: str) -> bool:
    """Email the backup zip as an attachment. Returns True on success."""
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        logger.warning("Auto-backup: SMTP creds not configured, skipping email send.")
        return False
    try:
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        filename = f"techzone-backup-{ts}.zip"

        msg = MIMEMultipart()
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email
        msg["Subject"] = f"{business_name} — Automatic backup ({datetime.now(timezone.utc).strftime('%Y-%m-%d')})"
        body = (
            f"<p>Hi,</p>"
            f"<p>This is the scheduled automatic backup for <b>{business_name}</b>.</p>"
            f"<p>Filename: <code>{filename}</code><br>"
            f"Size: <b>{len(zip_bytes) / 1024:.1f} KB</b></p>"
            f"<p>To restore: open Settings → Backup → "
            f"<i>Danger zone · Restore from backup</i> and upload this zip.</p>"
            f"<p style='color:#6b7280;font-size:13px;'>Keep at least one copy of this file in a place "
            f"that isn't your POS PC (cloud drive, external HDD).</p>"
        )
        msg.attach(MIMEText(body, "html"))

        part = MIMEBase("application", "zip")
        part.set_payload(zip_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f"attachment; filename={filename}")
        msg.attach(part)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
        logger.info(f"Auto-backup email sent → {to_email} ({len(zip_bytes) / 1024:.1f} KB)")
        return True
    except Exception as e:
        logger.error(f"Auto-backup email failed: {e}")
        return False


def _is_due(last_sent_iso: str | None, frequency: str) -> bool:
    """Return True if the next scheduled backup window has arrived."""
    interval = timedelta(days=30) if frequency == "monthly" else timedelta(days=7)
    if not last_sent_iso:
        return True
    try:
        last = datetime.fromisoformat(last_sent_iso.replace("Z", "+00:00"))
    except ValueError:
        return True
    return datetime.now(timezone.utc) - last >= interval


async def maybe_send_backup() -> bool:
    """Hook called by `services/scheduler.py` once an hour.

    Sends a fresh backup email if:
      - `auto_backup_enabled` is True
      - The configured frequency window has elapsed since `auto_backup_last_sent`
      - A recipient email is configured (or shift_report_email is set as fallback)

    Returns True if a backup was sent this tick (for logging/tests).
    """
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings or not settings.get("auto_backup_enabled"):
        return False

    to_email = (
        settings.get("auto_backup_email")
        or settings.get("shift_report_email")
        or ""
    ).strip()
    if not to_email:
        logger.info("Auto-backup: enabled but no recipient configured.")
        return False

    frequency = (settings.get("auto_backup_frequency") or "weekly").lower()
    if frequency not in ("weekly", "monthly"):
        frequency = "weekly"

    if not _is_due(settings.get("auto_backup_last_sent"), frequency):
        return False

    business_name = settings.get("business_name") or "TECHZONE"
    # business_name may be HTML (rich-text). Strip it for the subject line.
    import re
    business_name = re.sub(r"<[^>]+>", "", business_name).strip() or "TECHZONE"

    zip_bytes = await _build_backup_zip()
    sent = _send_backup_email(to_email, zip_bytes, business_name)
    if sent:
        await db.settings.update_one(
            {"id": "app_settings"},
            {"$set": {"auto_backup_last_sent": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
    return sent
