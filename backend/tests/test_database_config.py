import importlib

import pytest

from backend.app.services.database import DatabaseConnectionConfig


def test_postgres_config_builds_secure_url(monkeypatch):
    monkeypatch.setenv("SOURCE_DATABASE_TYPE", "postgres")
    monkeypatch.setenv("SOURCE_DATABASE_HOST", "db.internal")
    monkeypatch.setenv("SOURCE_DATABASE_PORT", "5432")
    monkeypatch.setenv("SOURCE_DATABASE_NAME", "analytics")
    monkeypatch.setenv("SOURCE_DATABASE_USER", "reporter")
    monkeypatch.setenv("SOURCE_DATABASE_PASSWORD", "secret")
    monkeypatch.setenv("SOURCE_DATABASE_SSL_MODE", "verify-full")
    monkeypatch.setenv("SOURCE_DATABASE_SSL_CA", "/certs/ca.pem")

    config = DatabaseConnectionConfig.from_env()

    assert config.type == "postgres"
    assert config.url.startswith("postgresql+psycopg2://")
    assert "db.internal" in config.url
    assert "sslmode=verify-full" in config.url
    assert "sslrootcert=%2Fcerts%2Fca.pem" in config.url


def test_explicit_source_url_is_preserved(monkeypatch):
    monkeypatch.setenv("SOURCE_DATABASE_URL", "mysql+pymysql://reader:secret@db.example:3306/warehouse?ssl=true")

    config = DatabaseConnectionConfig.from_env()

    assert config.type == "mysql"
    assert config.url == "mysql+pymysql://reader:secret@db.example:3306/warehouse?ssl=true"


def test_explicit_url_with_unknown_scheme_raises():
    with pytest.raises(ValueError):
        DatabaseConnectionConfig.from_env({"SOURCE_DATABASE_URL": "oracle://user:pw@host/db"})


def test_missing_required_fields_raises_without_url():
    with pytest.raises(ValueError):
        DatabaseConnectionConfig.from_env({"SOURCE_DATABASE_TYPE": "postgres"})


def test_db_module_imports_without_source_database_configured(monkeypatch):
    """db.py must not build the optional SOURCE_DATABASE_* engine eagerly —
    the app has to boot even when no external source is configured."""
    for key in (
        "SOURCE_DATABASE_URL", "SOURCE_DATABASE_HOST", "SOURCE_DATABASE_NAME", "SOURCE_DATABASE_USER",
    ):
        monkeypatch.delenv(key, raising=False)

    from backend.app import db as db_module

    importlib.reload(db_module)
    assert db_module.engine is not None
