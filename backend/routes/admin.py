"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
from core.security import get_current_user

router = APIRouter(tags=["Admin"])

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
