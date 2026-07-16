from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import settings
from ..services.database import SUPPORTED_DATABASE_TYPES, DatabaseConnectionConfig

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
