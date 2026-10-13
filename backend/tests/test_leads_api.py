from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.repositories.lead_repository import LeadRepository


def _utc_now_str(offset_minutes: int = 0) -> str:
    dt = datetime.now(timezone.utc) + timedelta(minutes=offset_minutes)
    return dt.isoformat().replace("+00:00", "Z")


def test_create_lead_creates_system_discussion(client: TestClient) -> None:
    res = client.post(
        "/api/v1/leads",
        json={"name": "Sarah Connor", "company": "Acme Corp", "phone": "555-0199"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Sarah Connor"
    assert data["company"] == "Acme Corp"
    assert data["phone"] == "555-0199"
    assert data["status"] == "new"
    assert data["last_note"] == "Lead created."
    assert data["last_discussion_at"] is not None

    # Check lead detail has system discussion
    detail_res = client.get(f"/api/v1/leads/{data['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["discussions"]) == 1
    assert detail["discussions"][0]["kind"] == "system"
    assert detail["discussions"][0]["note"] == "Lead created."


def test_create_lead_validation_errors(client: TestClient) -> None:
    res = client.post("/api/v1/leads", json={"name": "   ", "company": "Test"})
    assert res.status_code == 422
    err = res.json()
    assert "error" in err
    assert err["error"]["code"] == "VALIDATION_ERROR"
    assert len(err["error"]["details"]) > 0


def test_list_leads_ordered_by_latest_discussion(client: TestClient) -> None:
    l1 = client.post("/api/v1/leads", json={"name": "Lead 1"}).json()
    l2 = client.post("/api/v1/leads", json={"name": "Lead 2"}).json()

    # Note added to lead 1 makes lead 1 newer in discussions
    client.post(
        f"/api/v1/leads/{l1['id']}/discussions",
        json={"note": "New activity on lead 1"},
    )

    res = client.get("/api/v1/leads")
    assert res.status_code == 200
    items = res.json()["items"]
    assert items[0]["id"] == l1["id"]
    assert items[1]["id"] == l2["id"]


def test_list_leads_filters_by_status_and_search(client: TestClient) -> None:
    client.post("/api/v1/leads", json={"name": "Sarah Connor", "company": "Acme Corp"})
    c2 = client.post("/api/v1/leads", json={"name": "Hank Scorpio", "company": "Globex"}).json()
    client.patch(f"/api/v1/leads/{c2['id']}/status", json={"status": "qualified"})

    # Filter by status
    res = client.get("/api/v1/leads?status=qualified")
    assert res.status_code == 200
    assert len(res.json()["items"]) == 1
    assert res.json()["items"][0]["name"] == "Hank Scorpio"

    # Search query
    res2 = client.get("/api/v1/leads?q=sarah")
    assert res2.status_code == 200
    assert len(res2.json()["items"]) == 1
    assert res2.json()["items"][0]["name"] == "Sarah Connor"

    # Search query on company
    res3 = client.get("/api/v1/leads?q=globex")
    assert res3.status_code == 200
    assert len(res3.json()["items"]) == 1
    assert res3.json()["items"][0]["name"] == "Hank Scorpio"


def test_get_lead_timeline_reverse_chronological(client: TestClient) -> None:
    lead = client.post("/api/v1/leads", json={"name": "Timeline Lead"}).json()
    client.post(f"/api/v1/leads/{lead['id']}/discussions", json={"note": "First user note"})
    client.post(f"/api/v1/leads/{lead['id']}/discussions", json={"note": "Second user note"})

    res = client.get(f"/api/v1/leads/{lead['id']}")
    assert res.status_code == 200
    discussions = res.json()["discussions"]
    assert len(discussions) == 3
    assert discussions[0]["note"] == "Second user note"
    assert discussions[1]["note"] == "First user note"
    assert discussions[2]["note"] == "Lead created."


def test_get_lead_not_found(client: TestClient) -> None:
    res = client.get("/api/v1/leads/99999")
    assert res.status_code == 404
    err = res.json()
    assert err["error"]["code"] == "NOT_FOUND"


def test_note_with_follow_up_updates_lead(client: TestClient) -> None:
    lead = client.post("/api/v1/leads", json={"name": "Followup Lead"}).json()
    fu_time = _utc_now_str(120)

    res = client.post(
        f"/api/v1/leads/{lead['id']}/discussions",
        json={"note": "Follow up scheduled", "follow_up_at": fu_time},
    )
    assert res.status_code == 201
    payload = res.json()
    assert payload["lead"]["follow_up_at"] is not None
    assert payload["discussion"]["follow_up_at"] is not None

    # Verify list reflects it immediately
    list_res = client.get("/api/v1/leads")
    target = next(item for item in list_res.json()["items"] if item["id"] == lead["id"])
    assert target["follow_up_at"] is not None


def test_note_without_follow_up_preserves_existing_follow_up(client: TestClient) -> None:
    lead = client.post("/api/v1/leads", json={"name": "Preserve Lead"}).json()
    fu_time = _utc_now_str(120)

    # First note sets follow-up
    client.post(
        f"/api/v1/leads/{lead['id']}/discussions",
        json={"note": "Has follow up", "follow_up_at": fu_time},
    )

    # Second note has NO follow-up
    res = client.post(
        f"/api/v1/leads/{lead['id']}/discussions",
        json={"note": "Unrelated quick note"},
    )
    assert res.status_code == 201
    assert res.json()["lead"]["follow_up_at"] is not None


def test_note_with_past_follow_up_rejected(client: TestClient) -> None:
    lead = client.post("/api/v1/leads", json={"name": "Past FU Lead"}).json()
    past_time = _utc_now_str(-60)  # 1 hour ago

    res = client.post(
        f"/api/v1/leads/{lead['id']}/discussions",
        json={"note": "Past follow up", "follow_up_at": past_time},
    )
    assert res.status_code == 422
    err = res.json()
    assert err["error"]["code"] == "VALIDATION_ERROR"


def test_add_discussion_atomicity_on_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    lead = client.post("/api/v1/leads", json={"name": "Atomic Lead"}).json()
    fu_time = _utc_now_str(120)

    def failing_update_lead_follow_up(*args, **kwargs):
        raise RuntimeError("Simulated DB crash during follow-up update")

    monkeypatch.setattr(
        LeadRepository, "update_lead_follow_up", failing_update_lead_follow_up
    )

    with pytest.raises(RuntimeError):
        client.post(
            f"/api/v1/leads/{lead['id']}/discussions",
            json={"note": "Should rollback", "follow_up_at": fu_time},
        )

    # After rollback, discussion history must still have ONLY the initial system note
    detail = client.get(f"/api/v1/leads/{lead['id']}").json()
    assert len(detail["discussions"]) == 1
    assert detail["discussions"][0]["note"] == "Lead created."


def test_update_lead_status_persists(client: TestClient) -> None:
    lead = client.post("/api/v1/leads", json={"name": "Status Lead"}).json()
    res = client.patch(f"/api/v1/leads/{lead['id']}/status", json={"status": "won"})
    assert res.status_code == 200
    assert res.json()["status"] == "won"

    # Check detail
    detail = client.get(f"/api/v1/leads/{lead['id']}").json()
    assert detail["status"] == "won"


def test_clear_follow_up_marks_done(client: TestClient) -> None:
    lead = client.post("/api/v1/leads", json={"name": "Clear Lead"}).json()
    fu_time = _utc_now_str(120)
    client.post(
        f"/api/v1/leads/{lead['id']}/discussions",
        json={"note": "Scheduled", "follow_up_at": fu_time},
    )

    # Clear follow-up
    res = client.delete(f"/api/v1/leads/{lead['id']}/follow-up")
    assert res.status_code == 200
    assert res.json()["follow_up_at"] is None

    # Discussion history keeps historical follow-up timestamp
    detail = client.get(f"/api/v1/leads/{lead['id']}").json()
    assert detail["follow_up_at"] is None
    assert detail["discussions"][0]["follow_up_at"] is not None
