from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.seed import seed_db


def test_seed_is_idempotent(session: Session, client: TestClient) -> None:
    seed_db(session, reset=True)
    res1 = client.get("/api/v1/leads").json()
    assert len(res1["items"]) == 6

    # Running seed again should detect existing leads and not duplicate
    seed_db(session, reset=False)
    res2 = client.get("/api/v1/leads").json()
    assert len(res2["items"]) == 6
