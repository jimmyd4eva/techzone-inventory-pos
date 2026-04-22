"""Security, auth dependencies, and text-sanitization helpers."""
import re
import secrets
import string
from datetime import datetime, timezone, timedelta

import uuid

import bcrypt as bcrypt_lib
import jwt
from fastapi import HTTPException, Request

from .config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, db


# ---------- Passwords ----------
def hash_password(password: str) -> str:
    return bcrypt_lib.hashpw(password.encode('utf-8'), bcrypt_lib.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt_lib.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


# ---------- JWT ----------
def create_token(user_id: str, role: str, username: str = None, max_age_hours: int = None) -> tuple[str, str]:
    """Create a JWT. Returns (token, jti). jti uniquely identifies this session so
    it can be listed in the account audit panel and individually revoked.
    """
    jti = str(uuid.uuid4())
    hours = max_age_hours if max_age_hours is not None else JWT_EXPIRATION_HOURS
    payload = {
        "user_id": user_id,
        "role": role,
        "username": username,
        "jti": jti,
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM), jti


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Cookie used to transport the JWT. Reading from a httpOnly cookie is safer than
# localStorage because JavaScript cannot steal it via XSS.
AUTH_COOKIE_NAME = "techzone_token"


async def get_current_user(request: Request) -> dict:
    # Primary: httpOnly cookie (set by login endpoint when `withCredentials=true`)
    token = request.cookies.get(AUTH_COOKIE_NAME)
    # Fallback: legacy `Authorization: Bearer <jwt>` header. Kept for backward
    # compatibility during the cookie rollout so existing sessions don't break.
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    payload = verify_token(token)
    # Reject tokens whose session-id (jti) has been revoked via the account audit panel.
    jti = payload.get("jti")
    if jti and await db.login_audit.find_one({"id": jti, "revoked_at": {"$ne": None}}, {"_id": 0}):
        raise HTTPException(status_code=401, detail="Session revoked — please sign in again")
    return payload


def check_not_readonly(current_user: dict):
    """Block write operations for the demo account."""
    if current_user.get("username") == "demo":
        raise HTTPException(
            status_code=403,
            detail="Demo account is read-only. Write operations are not permitted.",
        )
    return current_user


# ---------- Activation ----------
def generate_activation_code() -> str:
    """Generate a cryptographically secure 6-digit activation code."""
    # Use `secrets` (not `random`) because this code gates device access.
    return ''.join(secrets.choice(string.digits) for _ in range(6))


# ---------- HTML sanitization for PDF/plain output ----------
_TAG_RE = re.compile(r'<[^>]+>')
_WS_RE = re.compile(r'\s+')


def strip_html(text) -> str:
    """Strip HTML tags and decode common entities for PDF/email plain-text use."""
    if not text:
        return ""
    s = str(text)
    s = re.sub(r'<\s*br\s*/?\s*>', ' ', s, flags=re.IGNORECASE)
    s = re.sub(r'</\s*(p|div|h[1-6])\s*>', ' ', s, flags=re.IGNORECASE)
    s = _TAG_RE.sub('', s)
    s = (
        s.replace('&nbsp;', ' ')
         .replace('&amp;', '&')
         .replace('&lt;', '<')
         .replace('&gt;', '>')
         .replace('&quot;', '"')
         .replace('&#39;', "'")
    )
    return _WS_RE.sub(' ', s).strip()
