import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import db
from admin_config import is_admin

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${dk.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        salt, expected_hash = stored_hash.split("$", 1)
        dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(dk.hex(), expected_hash)
    except Exception:
        return False


def create_user_session(user_id: int, days_valid: int = 60) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=days_valid)
    expires_str = expires.strftime("%Y-%m-%dT%H:%M:%SZ")
    db.create_session(token, user_id, expires_str)
    return token


def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Security(security)) -> dict:
    if not creds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Avtorizatsiya talab qilinadi",
            headers={"WWW-Authenticate": "Bearer"},
        )
    session = db.get_session(creds.credentials)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yaroqsiz yoki muddati o‘tgan sessiya",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check expiration
    expires_at = session.get("expires_at", "")
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if expires_at and expires_at < now_str:
        db.delete_session(creds.credentials)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya muddati tugagan, iltimos qayta kiring",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": session["user_id"],
        "username": session["username"],
        "token": session["token"],
        "isAdmin": is_admin(session["username"]),
    }


def get_optional_user(creds: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[dict]:
    if not creds:
        return None
    try:
        return get_current_user(creds)
    except HTTPException:
        return None


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if not current_user.get("isAdmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin huquqi talab qilinadi",
        )
    return current_user
