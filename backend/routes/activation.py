"""Route module extracted from server.py."""
import os
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger
from core.security import get_current_user, generate_activation_code
from services.email_service import send_activation_email
from models import ActivationCode, ActivatedDevice, ActivationRequest, ActivationVerify, ActivationCheckRequest

router = APIRouter(tags=["Device Activation"])

# Portable/single-PC installs don't need per-device activation. Setting
# ACTIVATION_DISABLED=true in the backend .env makes /api/activation/check
# always succeed so the Activation screen is skipped on fresh installs.
_ACTIVATION_DISABLED = os.environ.get("ACTIVATION_DISABLED", "").lower() in ("1", "true", "yes")

@router.post("/activation/check")
async def check_device_activation(request: ActivationCheckRequest):
    """Check if a device is activated - NO AUTH REQUIRED"""
    if _ACTIVATION_DISABLED:
        return {"is_activated": True, "activated_at": None, "activated_email": "portable@localhost"}
    device = await db.activated_devices.find_one({"device_id": request.device_id}, {"_id": 0})
    if device:
        return {
            "is_activated": True,
            "activated_at": device.get("activated_at"),
            "activated_email": device.get("activated_email")
        }
    return {"is_activated": False}

@router.post("/activation/request-code")
async def request_activation_code(request: ActivationRequest):
    """Generate and send activation code to email - NO AUTH REQUIRED"""
    email = request.email.lower().strip()
    
    # Validate email
    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail="Valid email address is required")
    
    # Generate 6-digit code
    code = generate_activation_code()
    
    # Create activation record with 12-hour expiry
    activation = ActivationCode(
        code=code,
        email=email,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=12)
    )
    
    # Store in database
    doc = activation.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['expires_at'] = doc['expires_at'].isoformat()
    await db.activation_codes.insert_one(doc)
    
    # Send email
    email_sent = send_activation_email(email, code)
    
    if email_sent:
        return {
            "success": True,
            "message": f"Activation code sent to {email}. Valid for 12 hours."
        }
    else:
        # Email failed but code is saved - return it for testing/manual use
        return {
            "success": True,
            "message": f"Activation code generated (email service unavailable). Valid for 12 hours. Code: {code}",
            "code": code  # Only include for debugging when email fails
        }

@router.post("/activation/activate")
async def activate_device(request: ActivationVerify):
    """Verify activation code and activate device - NO AUTH REQUIRED"""
    code = request.code.strip()
    device_id = request.device_id.strip()
    
    # Check if device is already activated
    existing_device = await db.activated_devices.find_one({"device_id": device_id})
    if existing_device:
        return {
            "success": True,
            "message": "Device is already activated",
            "already_activated": True
        }
    
    # Find valid activation code
    now = datetime.now(timezone.utc)
    activation = await db.activation_codes.find_one({
        "code": code,
        "is_used": False
    }, {"_id": 0})
    
    if not activation:
        raise HTTPException(status_code=400, detail="Invalid activation code")
    
    # Check expiry
    expires_at = datetime.fromisoformat(activation['expires_at'].replace('Z', '+00:00'))
    if now > expires_at:
        raise HTTPException(status_code=400, detail="Activation code has expired. Please request a new one.")
    
    # Mark code as used
    await db.activation_codes.update_one(
        {"code": code},
        {"$set": {"is_used": True, "device_id": device_id}}
    )
    
    # Create activated device record
    activated = ActivatedDevice(
        device_id=device_id,
        activation_code=code,
        activated_email=activation['email']
    )
    
    doc = activated.model_dump()
    doc['activated_at'] = doc['activated_at'].isoformat()
    await db.activated_devices.insert_one(doc)
    
    return {
        "success": True,
        "message": "Device activated successfully!",
        "activated_email": activation['email']
    }

@router.get("/activation/list")
async def list_activated_devices(current_user: dict = Depends(get_current_user)):
    """List all activated devices - ADMIN ONLY"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can view activated devices")
    
    devices = await db.activated_devices.find({}, {"_id": 0}).sort("activated_at", -1).to_list(1000)
    return devices

@router.delete("/activation/revoke/{device_id}")
async def revoke_device_activation(device_id: str, current_user: dict = Depends(get_current_user)):
    """Revoke a device's activation - ADMIN ONLY"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can revoke activations")
    
    result = await db.activated_devices.delete_one({"device_id": device_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"message": "Device activation revoked successfully"}
