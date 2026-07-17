import os
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlencode

from sqlalchemy import create_engine, text


SUPPORTED_DATABASE_TYPES = {"postgres", "mysql", "sqlite", "mssql"}

_URL_SCHEME_TO_TYPE = {
    "postgresql": "postgres",
    "postgres": "postgres",
    "mysql": "mysql",
    "sqlite": "sqlite",
    "mssql": "mssql",
}


def _infer_type_from_url(url: str) -> Optional[str]:
    scheme = url.split("://", 1)[0].split("+", 1)[0].lower()
    return _URL_SCHEME_TO_TYPE.get(scheme)


@dataclass
class DatabaseConnectionConfig:
    type: str
    url: str
    host: Optional[str] = None
    port: Optional[str] = None
    database: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None

    @classmethod
    def from_env(cls, env: Optional[dict] = None) -> "DatabaseConnectionConfig":
        env = os.environ if env is None else env
        explicit_url = env.get("SOURCE_DATABASE_URL", "").strip()

        if explicit_url:
            db_type = _infer_type_from_url(explicit_url)
            if db_type is None:
                raise ValueError(f"Could not determine database type from URL: {explicit_url}")
            return cls(type=db_type, url=explicit_url)

        db_type = (env.get("SOURCE_DATABASE_TYPE") or "postgres").strip().lower()

        if db_type not in SUPPORTED_DATABASE_TYPES:
            raise ValueError(f"Unsupported database type: {db_type}")

        host = env.get("SOURCE_DATABASE_HOST", "").strip()
        port = env.get("SOURCE_DATABASE_PORT", "").strip()
        database = env.get("SOURCE_DATABASE_NAME", "").strip()
        user = env.get("SOURCE_DATABASE_USER", "").strip()
        password = env.get("SOURCE_DATABASE_PASSWORD", "").strip()

        if db_type == "sqlite":
            url = f"sqlite:///{database or ':memory:'}"
            return cls(type=db_type, url=url, database=database or ":memory:")

        if not all([host, database, user]):
            raise ValueError("SOURCE_DATABASE_HOST, SOURCE_DATABASE_NAME and SOURCE_DATABASE_USER are required")

        if db_type == "postgres":
            query = {}
            ssl_mode = env.get("SOURCE_DATABASE_SSL_MODE", "prefer").strip() or "prefer"
            if ssl_mode:
                query["sslmode"] = ssl_mode
            ssl_ca = env.get("SOURCE_DATABASE_SSL_CA", "").strip()
            if ssl_ca:
                query["sslrootcert"] = ssl_ca
            ssl_cert = env.get("SOURCE_DATABASE_SSL_CERT", "").strip()
            if ssl_cert:
                query["sslcert"] = ssl_cert
            ssl_key = env.get("SOURCE_DATABASE_SSL_KEY", "").strip()
            if ssl_key:
                query["sslkey"] = ssl_key

            base_url = f"postgresql+psycopg2://{user}:{password}@{host}:{port or 5432}/{database}"
            if query:
                base_url = f"{base_url}?{urlencode(query)}"
            return cls(
                type=db_type,
                url=base_url,
                host=host,
                port=port or "5432",
                database=database,
                user=user,
                password=password,
            )

        if db_type == "mysql":
            query = {}
            ssl_enabled = env.get("SOURCE_DATABASE_SSL_MODE", "false").strip().lower()
            if ssl_enabled in {"true", "1", "yes", "on", "require", "verify-ca", "verify-full"}:
                query["ssl"] = "true"
            ssl_ca = env.get("SOURCE_DATABASE_SSL_CA", "").strip()
            if ssl_ca:
                query["ssl_ca"] = ssl_ca
            ssl_cert = env.get("SOURCE_DATABASE_SSL_CERT", "").strip()
            if ssl_cert:
                query["ssl_cert"] = ssl_cert
            ssl_key = env.get("SOURCE_DATABASE_SSL_KEY", "").strip()
            if ssl_key:
                query["ssl_key"] = ssl_key

            base_url = f"mysql+pymysql://{user}:{password}@{host}:{port or 3306}/{database}"
            if query:
                base_url = f"{base_url}?{urlencode(query)}"
            return cls(
                type=db_type,
                url=base_url,
                host=host,
                port=port or "3306",
                database=database,
                user=user,
                password=password,
            )

        if db_type == "mssql":
            query = {}
            encrypt = env.get("SOURCE_DATABASE_SSL_MODE", "true").strip().lower()
            if encrypt in {"true", "1", "yes", "on", "require", "verify-ca", "verify-full"}:
                query["Encrypt"] = "yes"
            else:
                query["Encrypt"] = "no"
            trust_server_certificate = env.get("SOURCE_DATABASE_TRUST_SERVER_CERTIFICATE", "false").strip().lower()
            if trust_server_certificate in {"true", "1", "yes", "on"}:
                query["TrustServerCertificate"] = "yes"
            else:
                query["TrustServerCertificate"] = "no"

            base_url = f"mssql+pyodbc://{user}:{password}@{host}:{port or 1433}/{database}"
            if query:
                base_url = f"{base_url}?{urlencode(query)}"
            return cls(
                type=db_type,
                url=base_url,
                host=host,
                port=port or "1433",
                database=database,
                user=user,
                password=password,
            )

        raise ValueError("Unsupported database configuration")

    def create_engine(self):
        return create_engine(self.url, pool_pre_ping=True)

    def test_connection(self):
        engine = self.create_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
