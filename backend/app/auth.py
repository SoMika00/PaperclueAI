from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
import jwt
from jwt import PyJWKClient

from .db import get_db

SUPABASE_PROJECT_URL = "https://dhcbvcpfwpvximourqbd.supabase.co"
JWKS_URL = f"{SUPABASE_PROJECT_URL}/auth/v1/.well-known/jwks.json"

jwk_client = PyJWKClient(JWKS_URL)
bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    token = credentials.credentials
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    return {"user_id": user_id, "claims": payload}


def deny_institution_admins(current_user: dict = Depends(get_current_user), db=Depends(get_db)) -> dict:
    """Router-level guard: institution admins manage their institution only —
    they have no use for the research features (manuscripts, discover, mind
    maps, library, university), so those endpoints are off-limits to them."""
    row = db.execute(
        text("select role from profiles where id = :uid"),
        {"uid": current_user["user_id"]},
    ).mappings().first()
    if row and row["role"] == "institution_admin":
        raise HTTPException(status_code=403, detail="Not available for institution admins")
    return current_user
