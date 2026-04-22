"""Route module extracted from server.py."""
import io
import json
import zipfile
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
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
async def download_backup(current_user: dict = Depends(get_current_user)):
    """Stream a ZIP containing every collection as JSON. Admin-only.

    The zip is built in-memory and streamed to the browser, so it works on
    both the cloud preview (no shell access) and the portable Windows build
    (no mongodump binary required) with the same code path.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export data")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for coll_name in await db.list_collection_names():
            docs = await db[coll_name].find({}, {"_id": 0}).to_list(length=None)
            docs = [_json_safe(d) for d in docs]
            zf.writestr(f"{coll_name}.json", json.dumps(docs, indent=2, default=str))
        # Manifest so a future restore tool can sanity-check the dump.
        manifest = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "exported_by": current_user.get("username"),
            "schema_version": 1,
        }
        zf.writestr("_manifest.json", json.dumps(manifest, indent=2))

    buf.seek(0)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    filename = f"techzone-backup-{ts}.zip"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
