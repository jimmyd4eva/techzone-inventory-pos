"""Route module extracted from server.py."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
from fastapi import UploadFile, File
from fastapi.responses import FileResponse
import shutil
import uuid
from pathlib import Path
from core.config import UPLOAD_DIR
from core.security import get_current_user, check_not_readonly
from models import Settings, SettingsUpdate

router = APIRouter()

@router.get("/settings/public")
async def get_public_settings():
    """Get public business info for display (no auth required)"""
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    
    # Return only public business info
    return {
        "business_name": settings.get("business_name", "TECHZONE") if settings else "TECHZONE",
        "business_address": settings.get("business_address", "30 Giltress Street, Kingston 2, JA") if settings else "30 Giltress Street, Kingston 2, JA",
        "business_phone": settings.get("business_phone", "876-633-9251 / 876-843-2416") if settings else "876-633-9251 / 876-843-2416",
        "business_logo": settings.get("business_logo") if settings else None
    }

@router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    # Define default settings structure
    default_settings = {
        "id": "app_settings",
        "tax_rate": 0.0,
        "tax_enabled": False,
        "currency": "USD",
        "tax_exempt_categories": [],
        "business_name": "TECHZONE",
        "business_address": "30 Giltress Street, Kingston 2, JA",
        "business_phone": "876-633-9251 / 876-843-2416",
        "business_logo": None,
        "points_enabled": False,
        "points_per_dollar": 0.002,
        "points_redemption_threshold": 3500,
        "points_value": 1,
        "updated_at": None,
        "updated_by": None
    }
    
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        # Create default settings in database and return
        await db.settings.insert_one(default_settings.copy())
        return default_settings
    
    # Merge defaults with existing settings - fill in any missing fields
    needs_update = False
    for key, default_value in default_settings.items():
        if key not in settings:
            settings[key] = default_value
            needs_update = True
    
    # Persist the updated settings back to database if any fields were missing
    if needs_update:
        await db.settings.update_one(
            {"id": "app_settings"},
            {"$set": settings}
        )
    
    return settings

@router.put("/settings")
async def update_settings(settings_data: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    # Only admin can update settings
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can update settings")
    
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['updated_by'] = current_user.get('username')
    
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    return settings

@router.post("/upload/logo")
async def upload_logo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a logo image file"""
    # Only admin can upload logo
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can upload logo")
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    filename = f"logo_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return the URL path that can be used to access the file
    logo_url = f"/api/uploads/{filename}"
    
    return {"logo_url": logo_url, "filename": filename}

@router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    ext = filename.split('.')[-1].lower()
    content_types = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
    }
    content_type = content_types.get(ext, 'application/octet-stream')
    
    return FileResponse(file_path, media_type=content_type)
