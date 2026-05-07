"""Route module extracted from server.py."""
import io
import json
import zipfile
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from core.config import db, logger
from core.security import get_current_user

router = APIRouter(tags=["Admin"])


def _json_safe(v):
    """Coerce Mongo types into JSON-serializable primitives."""
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, datetime):
        return v.isoformat()
    if isinstance(v, dict):
        return {k: _json_safe(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [_json_safe(x) for x in v]
    return v


@router.get("/admin/backup")
async def download_backup(
    passphrase: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Stream a ZIP containing every collection as JSON. Admin-only.

    Optional `?passphrase=...` query param wraps the zip in an AES-256-GCM
    envelope (file extension becomes `.zip.tzbk`). The same passphrase is
    required to restore.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export data")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for coll_name in await db.list_collection_names():
            docs = await db[coll_name].find({}, {"_id": 0}).to_list(length=None)
            docs = [_json_safe(d) for d in docs]
            zf.writestr(f"{coll_name}.json", json.dumps(docs, indent=2, default=str))
        manifest = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "exported_by": current_user.get("username"),
            "schema_version": 1,
        }
        zf.writestr("_manifest.json", json.dumps(manifest, indent=2))

    payload = buf.getvalue()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    if passphrase:
        from services.backup_crypto import encrypt
        payload = encrypt(payload, passphrase)
        filename = f"techzone-backup-{ts}.zip.tzbk"
        media_type = "application/octet-stream"
    else:
        filename = f"techzone-backup-{ts}.zip"
        media_type = "application/zip"
    return StreamingResponse(
        io.BytesIO(payload),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# Collections intentionally NOT wiped on restore, to avoid locking the admin
# out of their own machine mid-operation. They are still replaced if the zip
# contains them — just never blindly cleared beforehand.
_PROTECTED_COLLECTIONS = {"activated_devices"}


@router.post("/admin/restore")
async def _decode_backup_payload(file: UploadFile, passphrase: Optional[str]) -> bytes:
    """Read the uploaded file and return raw zip bytes, decrypting if needed.
    Raises HTTPException with a user-friendly 400 on any failure.
    """
    payload = await file.read()
    fname = (file.filename or "").lower()
    is_encrypted_ext = fname.endswith(".tzbk") or fname.endswith(".zip.tzbk")
    if is_encrypted_ext:
        from services.backup_crypto import decrypt
        if not passphrase:
            raise HTTPException(status_code=400, detail="This backup is encrypted. Please enter the passphrase.")
        try:
            payload = decrypt(payload, passphrase)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif not fname.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Please upload a .zip or .zip.tzbk file produced by the Backup button")
    return payload


def _parse_backup_zip(payload: bytes) -> Dict[str, List[Dict[str, Any]]]:
    """Parse and validate a backup zip's JSON entries WITHOUT mutating the DB.
    Returns {collection_name: [docs...]}. Raises HTTPException(400) on any
    schema/parse problem so the caller can short-circuit cleanly.
    """
    try:
        zf = zipfile.ZipFile(io.BytesIO(payload))
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="File is not a valid zip archive")

    names = [n for n in zf.namelist() if n.endswith(".json") and n != "_manifest.json"]
    if not names:
        raise HTTPException(status_code=400, detail="Zip contains no collection JSON files")

    parsed: Dict[str, List[Dict[str, Any]]] = {}
    for n in names:
        try:
            docs = json.loads(zf.read(n).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            raise HTTPException(status_code=400, detail=f"{n} is not valid JSON: {e}")
        if not isinstance(docs, list):
            raise HTTPException(status_code=400, detail=f"{n} must be a JSON array of documents")
        parsed[n[:-5]] = docs  # strip ".json"
    return parsed


async def _build_restore_diff(parsed: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """For each collection in `parsed`, count current docs and the incoming
    count so the frontend can show "+42 sales / -3 users" before the user
    commits. Pure read operation — no writes.
    """
    rows: List[Dict[str, Any]] = []
    for coll_name, docs in parsed.items():
        current = await db[coll_name].count_documents({})
        incoming = len(docs)
        rows.append({
            "collection": coll_name,
            "current": current,
            "incoming": incoming,
            "delta": incoming - current,
            "protected": coll_name in _PROTECTED_COLLECTIONS,
        })
    return sorted(rows, key=lambda r: r["collection"])


@router.post("/admin/restore/preview")
async def preview_restore(
    file: UploadFile = File(...),
    passphrase: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """Validate the uploaded backup AND return the per-collection delta the
    user is about to apply, without mutating anything. Admin-only.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can preview a restore")
    payload = await _decode_backup_payload(file, passphrase)
    parsed = _parse_backup_zip(payload)
    return {"diff": await _build_restore_diff(parsed), "total_collections": len(parsed)}


@router.post("/admin/restore")
async def restore_backup(
    file: UploadFile = File(...),
    passphrase: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """Replace every collection in the DB with the JSON documents in the
    uploaded backup zip. Admin-only. DESTRUCTIVE.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can restore data")

    payload = await _decode_backup_payload(file, passphrase)
    parsed = _parse_backup_zip(payload)

    summary: Dict[str, Dict[str, Any]] = {}
    total_restored = 0
    for coll_name, docs in parsed.items():
        try:
            if coll_name not in _PROTECTED_COLLECTIONS:
                deleted = await db[coll_name].delete_many({})
                deleted_count = deleted.deleted_count
            else:
                deleted_count = 0  # leave activated_devices intact
            if docs:
                await db[coll_name].insert_many(docs)
            summary[coll_name] = {"deleted": deleted_count, "inserted": len(docs)}
            total_restored += len(docs)
        except Exception as e:  # pragma: no cover — defensive
            summary[coll_name] = {"error": str(e)}

    return {
        "status": "completed",
        "total_restored": total_restored,
        "collections": summary,
        "note": "You may need to sign in again — the users collection was replaced.",
    }


@router.post("/admin/backup/send-now")
async def send_backup_now(current_user: dict = Depends(get_current_user)):
    """Trigger a one-off backup email immediately. Admin-only.

    Useful both as a 'verify my SMTP works' button and to grab a fresh copy
    without waiting for the next scheduler tick.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can send a backup")

    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0}) or {}
    to_email = (
        settings.get("auto_backup_email")
        or settings.get("shift_report_email")
        or ""
    ).strip()
    if not to_email:
        raise HTTPException(
            status_code=400,
            detail="No recipient configured. Set 'Backup recipient email' in Settings → Backup or 'Manager Email' in Cash Register.",
        )

    from services.auto_backup_service import _build_backup_zip, _send_backup_email
    import re
    business_name = re.sub(r"<[^>]+>", "", settings.get("business_name") or "TECHZONE").strip() or "TECHZONE"

    zip_bytes = await _build_backup_zip()
    sent = _send_backup_email(to_email, zip_bytes, business_name)
    if sent:
        await db.settings.update_one(
            {"id": "app_settings"},
            {"$set": {"auto_backup_last_sent": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
    return {"sent": sent, "recipient": to_email, "size_bytes": len(zip_bytes)}


@router.post("/admin/migrate-data")
async def migrate_data(current_user: dict = Depends(get_current_user)):
    # Only admins can run migration
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can run migrations")
    
    from pathlib import Path
    import json
    
    migration_dir = Path(__file__).parent.parent / "migration_data"
    
    if not migration_dir.exists():
        raise HTTPException(status_code=500, detail="Migration data directory not found")
    
    collections = ['users', 'customers', 'inventory', 'sales', 'repair_jobs']
    results = {}
    total_imported = 0
    
    for collection_name in collections:
        json_file = migration_dir / f"{collection_name}.json"
        
        if not json_file.exists():
            results[collection_name] = {"status": "skipped", "reason": "file not found"}
            continue
        
        try:
            # Load JSON data
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            if not data:
                results[collection_name] = {"status": "skipped", "reason": "no data"}
                continue
            
            # Clear existing data
            delete_result = await db[collection_name].delete_many({})
            
            # Import new data
            await db[collection_name].insert_many(data)
            
            total_imported += len(data)
            results[collection_name] = {
                "status": "success",
                "deleted": delete_result.deleted_count,
                "imported": len(data)
            }
            
        except Exception as e:
            results[collection_name] = {"status": "error", "message": str(e)}
    
    return {
        "status": "completed",
        "total_imported": total_imported,
        "collections": results
    }
