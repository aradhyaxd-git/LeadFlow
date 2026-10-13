from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, UTCDateTime


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    WON = "won"
    LOST = "lost"


class DiscussionKind(str, Enum):
    NOTE = "note"
    SYSTEM = "system"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    company: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    status: Mapped[LeadStatus] = mapped_column(
        SqlEnum(LeadStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=LeadStatus.NEW,
        index=True,
    )
    follow_up_at: Mapped[Optional[datetime]] = mapped_column(
        UTCDateTime(),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        UTCDateTime(),
        nullable=False,
        default=utc_now,
    )

    discussions: Mapped[list[Discussion]] = relationship(
        "Discussion",
        back_populates="lead",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Discussion(Base):
    __tablename__ = "discussions"
    __table_args__ = (
        Index("ix_discussions_lead_id_created_at", "lead_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)
    follow_up_at: Mapped[Optional[datetime]] = mapped_column(UTCDateTime(), nullable=True)
    kind: Mapped[DiscussionKind] = mapped_column(
        SqlEnum(DiscussionKind, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DiscussionKind.NOTE,
    )
    created_at: Mapped[datetime] = mapped_column(
        UTCDateTime(),
        nullable=False,
        default=utc_now,
    )

    lead: Mapped[Lead] = relationship("Lead", back_populates="discussions")
