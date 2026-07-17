import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from ..config import settings


def _fernet() -> Fernet:
    key_material = settings.connection_encryption_key or settings.supabase_service_role_key
    if not key_material:
        raise RuntimeError("CONNECTION_ENCRYPTION_KEY (or SUPABASE_SERVICE_ROLE_KEY fallback) is not set")
    digest = hashlib.sha256(key_material.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str:
    if not token:
        return ""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Stored secret could not be decrypted (encryption key changed?)") from exc
