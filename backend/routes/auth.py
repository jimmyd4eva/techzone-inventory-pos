"""Route module extracted from server.py."""
import os

from fastapi import APIRouter, HTTPException, Depends, Response, Request
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from core.config import db, logger, JWT_EXPIRATION_HOURS
from core.security import (
    AUTH_COOKIE_NAME,
    hash_password,
    verify_password,
    create_token,
    get_current_user,
    check_not_readonly,
)
from models import User, UserCreate, UserLogin, UserUpdate

router = APIRouter(tags=["Auth"])

# --- Cookie helpers ---------------------------------------------------------
# `secure=True` is required in production (browsers refuse Secure cookies over
# plain HTTP). We infer it from the preview/prod URL so local http dev still
# works. SameSite=lax is required for cross-site navigation to carry the
# cookie when user logs in via a redirect.
_COOKIE_SECURE = os.environ.get("REACT_APP_BACKEND_URL", "").startswith("https://") or \
    os.environ.get("COOKIE_SECURE", "false").lower() == "true"
_COOKIE_MAX_AGE = int(timedelta(hours=JWT_EXPIRATION_HOURS).total_seconds())
_REMEMBER_ME_MAX_AGE = int(timedelta(days=30).total_seconds())


def _set_auth_cookie(response: Response, token: str, remember_me: bool = False) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite="lax",
        max_age=_REMEMBER_ME_MAX_AGE if remember_me else _COOKIE_MAX_AGE,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=AUTH_COOKIE_NAME, path="/")


async def _log_login_event(request: Request, user_id: str, username: str, jti: str, remember_me: bool) -> None:
    """Insert a row into `login_audit` so the user can review recent sign-ins."""
    # Prefer real client IP from common reverse-proxy headers, else the socket peer.
    fwd = request.headers.get("x-forwarded-for", "")
    ip = (fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "")) or "unknown"
    await db.login_audit.insert_one({
        "id": jti,
        "user_id": user_id,
        "username": username,
        "ip": ip,
        "user_agent": (request.headers.get("user-agent") or "")[:512],
        "remember_me": bool(remember_me),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "revoked_at": None,
    })


@router.post("/auth/register")
async def register(user_data: UserCreate, request: Request, response: Response):
    # Check if user exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash password using bcrypt directly (Python 3.14 compatible)
    import bcrypt as bc
    password_hash = bc.hashpw(user_data.password.encode('utf-8'), bc.gensalt()).decode('utf-8')
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['password_hash'] = password_hash
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Create token
    token, jti = create_token(user.id, user.role, user.username)
    await _log_login_event(request, user.id, user.username, jti, False)
    _set_auth_cookie(response, token)
    
    return {"user": user, "token": token}

@router.post("/auth/login")
async def login(credentials: UserLogin, request: Request, response: Response):
    # Find user
    user_doc = await db.users.find_one({"username": credentials.username})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password using bcrypt directly (Python 3.14 compatible)
    import bcrypt as bc
    try:
        password_valid = bc.checkpw(
            credentials.password.encode('utf-8'), 
            user_doc['password_hash'].encode('utf-8')
        )
    except Exception:
        password_valid = False
    
    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token, jti = create_token(
        user_doc['id'], user_doc['role'], user_doc['username'],
        max_age_hours=24 * 30 if credentials.remember_me else None,
    )
    await _log_login_event(request, user_doc['id'], user_doc['username'], jti, credentials.remember_me)
    _set_auth_cookie(response, token, remember_me=credentials.remember_me)

    # Remove password hash from response
    user_doc.pop('password_hash', None)
    user_doc.pop('_id', None)

    return {"user": user_doc, "token": token}


@router.post("/auth/logout")
async def logout(response: Response):
    """Clear the httpOnly auth cookie. Idempotent — safe to call when already logged out."""
    _clear_auth_cookie(response)
    return {"message": "Logged out"}


@router.get("/auth/sessions")
async def list_sessions(request: Request, current_user: dict = Depends(get_current_user)):
    """Return recent login sessions for the current user (most recent first)."""
    current_jti = current_user.get("jti")
    cursor = db.login_audit.find(
        {"user_id": current_user["user_id"]}, {"_id": 0},
    ).sort("created_at", -1).limit(30)
    sessions = []
    async for row in cursor:
        sessions.append({
            "id": row["id"],
            "ip": row.get("ip"),
            "user_agent": row.get("user_agent"),
            "remember_me": row.get("remember_me", False),
            "created_at": row.get("created_at"),
            "revoked_at": row.get("revoked_at"),
            "is_current": row["id"] == current_jti,
        })
    return sessions


@router.post("/auth/sessions/{session_id}/revoke")
async def revoke_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Revoke one specific session. Future requests carrying that JWT's jti get 401."""
    row = await db.login_audit.find_one({"id": session_id}, {"_id": 0})
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    if row["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot revoke another user's session")
    await db.login_audit.update_one(
        {"id": session_id},
        {"$set": {"revoked_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "revoked": session_id}


@router.post("/auth/sessions/revoke-others")
async def revoke_other_sessions(current_user: dict = Depends(get_current_user)):
    """Revoke every session for this user except the one making the request.
    Handy if the owner suspects an ex-employee still has a browser logged in.
    """
    current_jti = current_user.get("jti")
    result = await db.login_audit.update_many(
        {
            "user_id": current_user["user_id"],
            "id": {"$ne": current_jti},
            "revoked_at": None,
        },
        {"$set": {"revoked_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "revoked_count": result.modified_count}

@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc

@router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    # Only admins can view all users
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")

    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)

    # Enrich with the most-recent login_audit row per user so the Users page
    # can show an "active today" indicator at a glance.
    user_ids = [u['id'] for u in users]
    last_logins: Dict[str, Dict[str, Any]] = {}
    if user_ids:
        pipeline = [
            {"$match": {"user_id": {"$in": user_ids}}},
            {"$sort": {"created_at": -1}},
            {"$group": {
                "_id": "$user_id",
                "last_login_at": {"$first": "$created_at"},
                "last_login_ip": {"$first": "$ip"},
            }},
        ]
        async for row in db.login_audit.aggregate(pipeline):
            last_logins[row["_id"]] = {
                "last_login_at": row.get("last_login_at"),
                "last_login_ip": row.get("last_login_ip"),
            }

    for user in users:
        # Handle missing or string created_at
        if 'created_at' not in user or user['created_at'] is None:
            user['created_at'] = datetime.now(timezone.utc)
        elif isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        # Attach last-login info (None if the user has never logged in since audit was added)
        user.update(last_logins.get(user['id'], {"last_login_at": None, "last_login_ip": None}))
    return users

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Only admins can delete users
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Don't allow deleting yourself
    if user_id == current_user['user_id']:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    check_not_readonly(current_user)
    # Only admins can update users
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    # Hash password if provided
    if 'password' in update_fields:
        update_fields['password_hash'] = hash_password(update_fields.pop('password'))
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully"}

