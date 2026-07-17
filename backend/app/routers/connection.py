from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..config import settings
from ..db import get_db
from ..models import DatabaseConnection, now
from ..services import crypto
from ..services.database import SUPPORTED_DATABASE_TYPES, DatabaseConnectionConfig
from .admin import _require_admin

router = APIRouter(prefix="/connections", tags=["connections"])


class ConnectionTestRequest(BaseModel):
    database_type: str = "postgres"
    database_url: str = ""
    database_host: str = ""
    database_port: str = ""
    database_name: str = ""
    database_user: str = ""
    database_password: str = ""
    database_ssl_mode: str = "prefer"
    database_ssl_ca: str = ""
    database_ssl_cert: str = ""
    database_ssl_key: str = ""
    database_trust_server_certificate: str = "false"

    def as_env(self) -> dict:
        return {
            "SOURCE_DATABASE_TYPE": self.database_type,
            "SOURCE_DATABASE_URL": self.database_url,
            "SOURCE_DATABASE_HOST": self.database_host,
            "SOURCE_DATABASE_PORT": self.database_port,
            "SOURCE_DATABASE_NAME": self.database_name,
            "SOURCE_DATABASE_USER": self.database_user,
            "SOURCE_DATABASE_PASSWORD": self.database_password,
            "SOURCE_DATABASE_SSL_MODE": self.database_ssl_mode,
            "SOURCE_DATABASE_SSL_CA": self.database_ssl_ca,
            "SOURCE_DATABASE_SSL_CERT": self.database_ssl_cert,
            "SOURCE_DATABASE_SSL_KEY": self.database_ssl_key,
            "SOURCE_DATABASE_TRUST_SERVER_CERTIFICATE": self.database_trust_server_certificate,
        }


def _configured_env() -> dict:
    """The SOURCE_DATABASE_* connection as loaded by app settings (.env file),
    not raw os.environ — consistent whether or not the host process exports
    them, unlike docker-compose's env_file which does both."""
    return {
        "SOURCE_DATABASE_TYPE": settings.source_database_type,
        "SOURCE_DATABASE_URL": settings.source_database_url,
        "SOURCE_DATABASE_HOST": settings.source_database_host,
        "SOURCE_DATABASE_PORT": settings.source_database_port,
        "SOURCE_DATABASE_NAME": settings.source_database_name,
        "SOURCE_DATABASE_USER": settings.source_database_user,
        "SOURCE_DATABASE_PASSWORD": settings.source_database_password,
        "SOURCE_DATABASE_SSL_MODE": settings.source_database_ssl_mode,
        "SOURCE_DATABASE_SSL_CA": settings.source_database_ssl_ca,
        "SOURCE_DATABASE_SSL_CERT": settings.source_database_ssl_cert,
        "SOURCE_DATABASE_SSL_KEY": settings.source_database_ssl_key,
        "SOURCE_DATABASE_TRUST_SERVER_CERTIFICATE": settings.source_database_trust_server_certificate,
    }


def _is_configured() -> bool:
    return bool(
        settings.source_database_url.strip()
        or (settings.source_database_host.strip() and settings.source_database_name.strip())
        or settings.source_database_type.strip().lower() == "sqlite"
    )


@router.get("/health")
def get_connection_health():
    if not _is_configured():
        return {"status": "not_configured"}
    try:
        config = DatabaseConnectionConfig.from_env(_configured_env())
        config.test_connection()
        return {
            "status": "ok",
            "database_type": config.type,
            "database_host": config.host,
            "database_name": config.database,
            "secure": True,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/config")
def get_connection_config():
    if not _is_configured():
        return {"configured": False}
    try:
        config = DatabaseConnectionConfig.from_env(_configured_env())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {
        "configured": True,
        "database_type": config.type,
        "database_host": config.host,
        "database_name": config.database,
        "secure": True,
    }


@router.get("/types")
def get_supported_database_types():
    return {"types": sorted(SUPPORTED_DATABASE_TYPES)}


@router.post("/test")
def test_connection(payload: ConnectionTestRequest):
    """Validate connection parameters entered in the UI without persisting
    them anywhere — never touches the process environment or a .env file."""
    try:
        config = DatabaseConnectionConfig.from_env(payload.as_env())
        config.test_connection()
        return {
            "status": "ok",
            "database_type": config.type,
            "database_host": config.host,
            "database_name": config.database,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class CreateConnectionRequest(ConnectionTestRequest):
    name: str


def _row_to_env(row: DatabaseConnection, secret: str) -> dict:
    if row.uses_url:
        return {"SOURCE_DATABASE_TYPE": row.database_type, "SOURCE_DATABASE_URL": secret}
    return {
        "SOURCE_DATABASE_TYPE": row.database_type,
        "SOURCE_DATABASE_URL": "",
        "SOURCE_DATABASE_HOST": row.database_host,
        "SOURCE_DATABASE_PORT": row.database_port,
        "SOURCE_DATABASE_NAME": row.database_name,
        "SOURCE_DATABASE_USER": row.database_user,
        "SOURCE_DATABASE_PASSWORD": secret,
        "SOURCE_DATABASE_SSL_MODE": row.ssl_mode,
        "SOURCE_DATABASE_SSL_CA": row.ssl_ca,
        "SOURCE_DATABASE_SSL_CERT": row.ssl_cert,
        "SOURCE_DATABASE_SSL_KEY": row.ssl_key,
        "SOURCE_DATABASE_TRUST_SERVER_CERTIFICATE": row.trust_server_certificate,
    }


def _public(row: DatabaseConnection) -> dict:
    """Saved-connection response shape — never includes the encrypted secret."""
    return {
        "id": row.id,
        "name": row.name,
        "database_type": row.database_type,
        "uses_url": row.uses_url,
        "database_host": row.database_host,
        "database_name": row.database_name,
        "database_user": row.database_user,
        "status": row.status,
        "last_error": row.last_error,
        "last_tested_at": row.last_tested_at,
        "created_at": row.created_at,
    }


@router.get("")
def list_saved_connections(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    ctx = _require_admin(db, current_user["user_id"])
    institution_id = str(ctx["institution_id"])
    rows = (
        db.query(DatabaseConnection)
        .filter(DatabaseConnection.institution_id == institution_id)
        .order_by(DatabaseConnection.created_at.desc())
        .all()
    )
    return [_public(r) for r in rows]


@router.post("")
def create_saved_connection(
    payload: CreateConnectionRequest,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Test the connection, then persist it — the credentials are only ever
    saved once a live connection has actually succeeded."""
    ctx = _require_admin(db, current_user["user_id"])
    try:
        config = DatabaseConnectionConfig.from_env(payload.as_env())
        config.test_connection()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    uses_url = bool(payload.database_url.strip())
    secret = payload.database_url.strip() if uses_url else payload.database_password
    row = DatabaseConnection(
        institution_id=str(ctx["institution_id"]),
        created_by=current_user["user_id"],
        name=payload.name.strip() or f"{config.type} connection",
        database_type=config.type,
        uses_url=uses_url,
        database_host=config.host or "",
        database_port=config.port or "",
        database_name=config.database or "",
        database_user=config.user or "",
        secret_encrypted=crypto.encrypt(secret) if secret else "",
        ssl_mode=payload.database_ssl_mode,
        ssl_ca=payload.database_ssl_ca,
        ssl_cert=payload.database_ssl_cert,
        ssl_key=payload.database_ssl_key,
        trust_server_certificate=payload.database_trust_server_certificate,
        status="ok",
        last_error="",
        last_tested_at=now(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _public(row)


def _get_owned_connection(db, institution_id: str, connection_id: str) -> DatabaseConnection:
    row = (
        db.query(DatabaseConnection)
        .filter(
            DatabaseConnection.id == connection_id,
            DatabaseConnection.institution_id == institution_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Connection not found")
    return row


@router.delete("/{connection_id}")
def delete_saved_connection(
    connection_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)
):
    ctx = _require_admin(db, current_user["user_id"])
    row = _get_owned_connection(db, str(ctx["institution_id"]), connection_id)
    db.delete(row)
    db.commit()
    return {"deleted": connection_id}


@router.post("/{connection_id}/test")
def retest_saved_connection(
    connection_id: str, db=Depends(get_db), current_user: dict = Depends(get_current_user)
):
    ctx = _require_admin(db, current_user["user_id"])
    row = _get_owned_connection(db, str(ctx["institution_id"]), connection_id)
    try:
        secret = crypto.decrypt(row.secret_encrypted)
        config = DatabaseConnectionConfig.from_env(_row_to_env(row, secret))
        config.test_connection()
        row.status, row.last_error = "ok", ""
    except Exception as exc:
        row.status, row.last_error = "error", str(exc)[:500]
    row.last_tested_at = now()
    db.commit()
    db.refresh(row)
    return _public(row)
