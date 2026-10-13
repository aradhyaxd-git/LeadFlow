from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    DiscussionCreate,
    DiscussionCreatedResponse,
    LeadCreate,
    LeadDetail,
    LeadListResponse,
    LeadStatus,
    LeadStatusUpdate,
    LeadSummary,
)
from app.services.lead_service import LeadService

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


def get_lead_service(session: Session = Depends(get_db)) -> LeadService:
    return LeadService(session)


@router.get("", response_model=LeadListResponse)
def list_leads(
    lead_status: Optional[LeadStatus] = Query(default=None, alias="status"),
    q: Optional[str] = Query(default=None),
    service: LeadService = Depends(get_lead_service),
) -> LeadListResponse:
    return service.list_leads(status=lead_status, q=q)


@router.post("", response_model=LeadSummary, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    service: LeadService = Depends(get_lead_service),
) -> LeadSummary:
    return service.create_lead(payload)


@router.get("/{lead_id}", response_model=LeadDetail)
def get_lead(
    lead_id: int,
    service: LeadService = Depends(get_lead_service),
) -> LeadDetail:
    return service.get_lead_detail(lead_id)


@router.patch("/{lead_id}/status", response_model=LeadSummary)
def update_lead_status(
    lead_id: int,
    payload: LeadStatusUpdate,
    service: LeadService = Depends(get_lead_service),
) -> LeadSummary:
    return service.update_status(lead_id, payload)


@router.post(
    "/{lead_id}/discussions",
    response_model=DiscussionCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_discussion(
    lead_id: int,
    payload: DiscussionCreate,
    service: LeadService = Depends(get_lead_service),
) -> DiscussionCreatedResponse:
    return service.add_discussion(lead_id, payload)


@router.delete("/{lead_id}/follow-up", response_model=LeadSummary)
def clear_follow_up(
    lead_id: int,
    service: LeadService = Depends(get_lead_service),
) -> LeadSummary:
    return service.clear_follow_up(lead_id)
