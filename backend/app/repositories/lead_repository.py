from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import Select, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models import Discussion, DiscussionKind, Lead, LeadStatus


@dataclass(frozen=True)
class LeadRow:
    lead: Lead
    last_note: str | None
    last_discussion_at: datetime | None


class LeadRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _base_lead_summary_query(self) -> Select[tuple[Lead, str | None, datetime | None]]:
        last_note_subq = (
            select(Discussion.note)
            .where(Discussion.lead_id == Lead.id)
            .order_by(desc(Discussion.created_at), desc(Discussion.id))
            .limit(1)
            .correlate(Lead)
            .scalar_subquery()
        )
        last_discussion_at_subq = (
            select(Discussion.created_at)
            .where(Discussion.lead_id == Lead.id)
            .order_by(desc(Discussion.created_at), desc(Discussion.id))
            .limit(1)
            .correlate(Lead)
            .scalar_subquery()
        )
        return (
            select(
                Lead,
                last_note_subq.label("last_note"),
                last_discussion_at_subq.label("last_discussion_at"),
            )
            .order_by(
                desc(func.coalesce(last_discussion_at_subq, Lead.created_at)),
                desc(Lead.id),
            )
        )

    def list_leads(
        self,
        *,
        status: LeadStatus | None = None,
        q: str | None = None,
    ) -> list[LeadRow]:
        stmt = self._base_lead_summary_query()
        if status is not None:
            stmt = stmt.where(Lead.status == status)
        if q is not None and q.strip():
            pattern = f"%{q.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Lead.name).like(pattern),
                    func.lower(func.coalesce(Lead.company, "")).like(pattern),
                )
            )
        rows = self._session.execute(stmt).all()
        return [
            LeadRow(
                lead=row[0],
                last_note=row[1],
                last_discussion_at=row[2],
            )
            for row in rows
        ]

    def get_lead_row(self, lead_id: int) -> LeadRow | None:
        stmt = self._base_lead_summary_query().where(Lead.id == lead_id)
        row = self._session.execute(stmt).first()
        if row is None:
            return None
        return LeadRow(
            lead=row[0],
            last_note=row[1],
            last_discussion_at=row[2],
        )

    def get_by_id(self, lead_id: int) -> Lead | None:
        return self._session.get(Lead, lead_id)

    def list_discussions(self, lead_id: int) -> list[Discussion]:
        stmt = (
            select(Discussion)
            .where(Discussion.lead_id == lead_id)
            .order_by(desc(Discussion.created_at), desc(Discussion.id))
        )
        return list(self._session.scalars(stmt).all())

    def add_lead(
        self,
        *,
        name: str,
        company: str | None,
        phone: str | None,
        status: LeadStatus = LeadStatus.NEW,
        follow_up_at: datetime | None = None,
        created_at: datetime | None = None,
    ) -> Lead:
        lead = Lead(
            name=name,
            company=company,
            phone=phone,
            status=status,
            follow_up_at=follow_up_at,
        )
        if created_at is not None:
            lead.created_at = created_at
        self._session.add(lead)
        self._session.flush()
        return lead

    def add_discussion(
        self,
        *,
        lead_id: int,
        note: str,
        follow_up_at: datetime | None = None,
        kind: DiscussionKind = DiscussionKind.NOTE,
        created_at: datetime | None = None,
    ) -> Discussion:
        discussion = Discussion(
            lead_id=lead_id,
            note=note,
            follow_up_at=follow_up_at,
            kind=kind,
        )
        if created_at is not None:
            discussion.created_at = created_at
        self._session.add(discussion)
        self._session.flush()
        return discussion

    def update_lead_follow_up(self, lead: Lead, follow_up_at: datetime | None) -> Lead:
        lead.follow_up_at = follow_up_at
        self._session.add(lead)
        self._session.flush()
        return lead

    def update_lead_status(self, lead: Lead, status: LeadStatus) -> Lead:
        lead.status = status
        self._session.add(lead)
        self._session.flush()
        return lead

    def count_leads(self) -> int:
        stmt = select(func.count(Lead.id))
        return int(self._session.scalar(stmt) or 0)
