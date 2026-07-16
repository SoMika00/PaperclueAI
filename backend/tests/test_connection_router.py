from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.routers.connection import router


def make_client():
    app = FastAPI()
    app.include_router(router, prefix="/api")
    return TestClient(app)


def test_test_endpoint_succeeds_for_sqlite_memory():
    client = make_client()
    resp = client.post("/api/connections/test", json={"database_type": "sqlite"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["database_type"] == "sqlite"


def test_test_endpoint_rejects_unreachable_postgres():
    client = make_client()
    resp = client.post(
        "/api/connections/test",
        json={
            "database_type": "postgres",
            "database_host": "does-not-exist.invalid",
            "database_port": "5432",
            "database_name": "db",
            "database_user": "user",
            "database_password": "pw",
        },
    )
    assert resp.status_code == 400


def test_test_endpoint_rejects_incomplete_params():
    client = make_client()
    resp = client.post("/api/connections/test", json={"database_type": "postgres"})
    assert resp.status_code == 400


def test_types_endpoint_lists_supported_types():
    client = make_client()
    resp = client.get("/api/connections/types")
    assert resp.status_code == 200
    assert set(resp.json()["types"]) == {"postgres", "mysql", "sqlite", "mssql"}
