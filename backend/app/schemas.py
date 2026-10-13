from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.models import DiscussionKind, LeadStatus


def _format_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    utc_dt = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
    return utc_dt.isoformat().replace("+00:00", "Z")


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)


class ErrorEnvelope(BaseModel):
    error: ErrorBody


class LeadCreate(BaseModel):
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Name is required and cannot be blank.")
        if len(trimmed) > 120:
            raise ValueError("Name must be 120 characters or fewer.")
        return trimmed

    @field_validator("company")
    @classmethod
    def validate_company(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            return None
        if len(trimmed) > 120:
            raise ValueError("Company must be 120 characters or fewer.")
        return trimmed

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            return None
        if len(trimmed) > 40:
            raise ValueError("Phone must be 40 characters or fewer.")
        return trimmed


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class DiscussionCreate(BaseModel):
    note: str
    follow_up_at: Optional[datetime] = None

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Discussion note cannot be empty.")
        if len(trimmed) > 2000:
            raise ValueError("Discussion note must be 2000 characters or fewer.")
        return trimmed

    @field_validator("follow_up_at")
    @classmethod
    def validate_follow_up_at(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return None
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("Follow-up timestamp must include timezone information.")
        utc_v = v.astimezone(timezone.utc)
        grace_cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
        if utc_v < grace_cutoff:
            raise ValueError("Follow-up date cannot be in the past.")
        return utc_v


class DiscussionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    follow_up_at: Optional[datetime] = None
    kind: DiscussionKind
    created_at: datetime

    @field_serializer("follow_up_at", "created_at")
    def serialize_dt(self, dt: Optional[datetime]) -> Optional[str]:
        return _format_utc_iso(dt)


class LeadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    status: LeadStatus
    follow_up_at: Optional[datetime] = None
    created_at: datetime
    last_note: Optional[str] = None
    last_discussion_at: Optional[datetime] = None

    @field_serializer("follow_up_at", "created_at", "last_discussion_at")
    def serialize_dt(self, dt: Optional[datetime]) -> Optional[str]:
        return _format_utc_iso(dt)


class LeadListResponse(BaseModel):
    items: list[LeadSummary]


class LeadDetail(LeadSummary):
    discussions: list[DiscussionResponse]


class DiscussionCreatedResponse(BaseModel):
    discussion: DiscussionResponse
    lead: LeadSummary
