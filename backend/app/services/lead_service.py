from __future__ import annotations

from sqlalchemy.orm import Session

from app.errors import NotFoundError
from app.models import DiscussionKind, LeadStatus
from app.repositories.lead_repository import LeadRepository, LeadRow
from app.schemas import (
    DiscussionCreate,
    DiscussionCreatedResponse,
    DiscussionResponse,
    LeadCreate,
    LeadDetail,
    LeadListResponse,
    LeadStatusUpdate,
    LeadSummary,
)


def _to_lead_summary(row: LeadRow) -> LeadSummary:
    return LeadSummary(
        id=row.lead.id,
        name=row.lead.name,
        company=row.lead.company,
        phone=row.lead.phone,
        status=row.lead.status,
        follow_up_at=row.lead.follow_up_at,
        created_at=row.lead.created_at,
        last_note=row.last_note,
        last_discussion_at=row.last_discussion_at,
    )


class LeadService:
    def __init__(self, session: Session) -> None:
        self._session = session
        self._repo = LeadRepository(session)

    def list_leads(
        self,
        *,
        status: LeadStatus | None = None,
        q: str | None = None,
    ) -> LeadListResponse:
        rows = self._repo.list_leads(status=status, q=q)
        return LeadListResponse(items=[_to_lead_summary(r) for r in rows])

    def get_lead_detail(self, lead_id: int) -> LeadDetail:
        row = self._repo.get_lead_row(lead_id)
        if row is None:
            raise NotFoundError(f"Lead with id {lead_id} was not found.")
        discussions = self._repo.list_discussions(lead_id)
        summary = _to_lead_summary(row)
        return LeadDetail(
            **summary.model_dump(),
            discussions=[DiscussionResponse.model_validate(d) for d in discussions],
        )

    def create_lead(self, payload: LeadCreate) -> LeadSummary:
        try:
            lead = self._repo.add_lead(
                name=payload.name,
                company=payload.company,
                phone=payload.phone,
                status=LeadStatus.NEW,
            )
            self._repo.add_discussion(
                lead_id=lead.id,
                note="Lead created.",
                kind=DiscussionKind.SYSTEM,
            )
            self._session.commit()
        except Exception:
            self._session.rollback()
            raise

        row = self._repo.get_lead_row(lead.id)
        if row is None:
            raise NotFoundError(f"Lead with id {lead.id} was not found.")
        return _to_lead_summary(row)

    def add_discussion(
        self,
        lead_id: int,
        payload: DiscussionCreate,
    ) -> DiscussionCreatedResponse:
        lead = self._repo.get_by_id(lead_id)
        if lead is None:
            raise NotFoundError(f"Lead with id {lead_id} was not found.")

        try:
            discussion = self._repo.add_discussion(
                lead_id=lead.id,
                note=payload.note,
                follow_up_at=payload.follow_up_at,
                kind=DiscussionKind.NOTE,
            )
            if payload.follow_up_at is not None:
                self._repo.update_lead_follow_up(lead, payload.follow_up_at)
            self._session.commit()
        except Exception:
            self._session.rollback()
            raise

        row = self._repo.get_lead_row(lead.id)
        if row is None:
            raise NotFoundError(f"Lead with id {lead.id} was not found.")
        return DiscussionCreatedResponse(
            discussion=DiscussionResponse.model_validate(discussion),
            lead=_to_lead_summary(row),
        )

    def update_status(self, lead_id: int, payload: LeadStatusUpdate) -> LeadSummary:
        lead = self._repo.get_by_id(lead_id)
        if lead is None:
            raise NotFoundError(f"Lead with id {lead_id} was not found.")

        try:
            self._repo.update_lead_status(lead, payload.status)
            self._session.commit()
        except Exception:
            self._session.rollback()
            raise

        row = self._repo.get_lead_row(lead.id)
        if row is None:
            raise NotFoundError(f"Lead with id {lead.id} was not found.")
        return _to_lead_summary(row)

    def clear_follow_up(self, lead_id: int) -> LeadSummary:
        lead = self._repo.get_by_id(lead_id)
        if lead is None:
            raise NotFoundError(f"Lead with id {lead_id} was not found.")

        try:
            self._repo.update_lead_follow_up(lead, None)
            self._session.commit()
        except Exception:
            self._session.rollback()
            raise

        row = self._repo.get_lead_row(lead.id)
        if row is None:
            raise NotFoundError(f"Lead with id {lead.id} was not found.")
        return _to_lead_summary(row)
