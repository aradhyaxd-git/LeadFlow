from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db import SessionLocal, init_db
from app.models import Discussion, DiscussionKind, Lead, LeadStatus
from app.repositories.lead_repository import LeadRepository


def seed_db(session: Session | None = None, *, reset: bool = False) -> None:
    close_session = False
    if session is None:
        init_db()
        session = SessionLocal()
        close_session = True

    try:
        repo = LeadRepository(session)
        count = repo.count_leads()
        if reset:
            session.execute(delete(Discussion))
            session.execute(delete(Lead))
            session.commit()
            count = 0

        if count > 0:
            print(f"Database already contains {count} leads; skipping seed.")
            return

        now = datetime.now(timezone.utc)

        # 1. Sarah Connor (Acme Corp) - proposal_sent, due today in ~3 hours, 3 discussions
        sarah_created = now - timedelta(days=6)
        sarah_fu = now + timedelta(hours=3)
        sarah = repo.add_lead(
            name="Sarah Connor",
            company="Acme Corp",
            phone="555-0199",
            status=LeadStatus.PROPOSAL_SENT,
            follow_up_at=sarah_fu,
            created_at=sarah_created,
        )
        repo.add_discussion(
            lead_id=sarah.id,
            note="Lead created.",
            kind=DiscussionKind.SYSTEM,
            created_at=sarah_created,
        )
        sarah_note = (
            "Initial discovery call. They need a CRM for 50 reps. "
            "Pain points include dropping leads and no follow-up tracking."
        )
        repo.add_discussion(
            lead_id=sarah.id,
            note=sarah_note,
            kind=DiscussionKind.NOTE,
            created_at=now - timedelta(days=5),
        )
        repo.add_discussion(
            lead_id=sarah.id,
            note="Sent pricing tier PDF. Said she would review with her boss.",
            follow_up_at=sarah_fu,
            kind=DiscussionKind.NOTE,
            created_at=now - timedelta(days=2),
        )

        # 2. Bill Lumbergh (Initech) - contacted, overdue by 2 days
        bill_created = now - timedelta(days=7)
        bill_fu = now - timedelta(days=2)
        bill = repo.add_lead(
            name="Bill Lumbergh",
            company="Initech",
            phone="555-0120",
            status=LeadStatus.CONTACTED,
            follow_up_at=bill_fu,
            created_at=bill_created,
        )
        repo.add_discussion(
            lead_id=bill.id,
            note="Lead created.",
            kind=DiscussionKind.SYSTEM,
            created_at=bill_created,
        )
        repo.add_discussion(
            lead_id=bill.id,
            note="Left a voicemail with his assistant regarding TPS report workflows.",
            follow_up_at=bill_fu,
            kind=DiscussionKind.NOTE,
            created_at=now - timedelta(days=4),
        )

        # 3. Hank Scorpio (Globex) - new, inbound lead 2 hours ago
        hank_created = now - timedelta(hours=2)
        hank = repo.add_lead(
            name="Hank Scorpio",
            company="Globex",
            phone="555-0123",
            status=LeadStatus.NEW,
            created_at=hank_created,
        )
        repo.add_discussion(
            lead_id=hank.id,
            note="Lead created.",
            kind=DiscussionKind.SYSTEM,
            created_at=hank_created,
        )
        repo.add_discussion(
            lead_id=hank.id,
            note="Inbound lead from website contact form.",
            kind=DiscussionKind.NOTE,
            created_at=hank_created + timedelta(minutes=5),
        )

        # 4. Tony Stark (Stark Industries) - qualified, follow-up tomorrow
        tony_created = now - timedelta(days=3)
        tony_fu = now + timedelta(days=1)
        tony = repo.add_lead(
            name="Tony Stark",
            company="Stark Industries",
            phone="555-3000",
            status=LeadStatus.QUALIFIED,
            follow_up_at=tony_fu,
            created_at=tony_created,
        )
        repo.add_discussion(
            lead_id=tony.id,
            note="Lead created.",
            kind=DiscussionKind.SYSTEM,
            created_at=tony_created,
        )
        repo.add_discussion(
            lead_id=tony.id,
            note="Reviewed enterprise security requirements. Scheduled architecture call.",
            follow_up_at=tony_fu,
            kind=DiscussionKind.NOTE,
            created_at=now - timedelta(hours=8),
        )

        # 5. Bruce Wayne (Wayne Enterprises) - won
        bruce_created = now - timedelta(days=21)
        bruce = repo.add_lead(
            name="Bruce Wayne",
            company="Wayne Enterprises",
            phone="555-0144",
            status=LeadStatus.WON,
            created_at=bruce_created,
        )
        repo.add_discussion(
            lead_id=bruce.id,
            note="Lead created.",
            kind=DiscussionKind.SYSTEM,
            created_at=bruce_created,
        )
        repo.add_discussion(
            lead_id=bruce.id,
            note="Contract signed! Sending welcome package.",
            kind=DiscussionKind.NOTE,
            created_at=now - timedelta(days=14),
        )

        # 6. Ellen Ripley (Weyland-Yutani) - lost
        ellen_created = now - timedelta(days=30)
        ellen = repo.add_lead(
            name="Ellen Ripley",
            company="Weyland-Yutani",
            phone="555-0188",
            status=LeadStatus.LOST,
            created_at=ellen_created,
        )
        repo.add_discussion(
            lead_id=ellen.id,
            note="Lead created.",
            kind=DiscussionKind.SYSTEM,
            created_at=ellen_created,
        )
        repo.add_discussion(
            lead_id=ellen.id,
            note="Budget reallocated to exploration division. Mark lost for Q4.",
            kind=DiscussionKind.NOTE,
            created_at=now - timedelta(days=20),
        )

        session.commit()
        print("Successfully seeded 6 leads with realistic discussion histories.")
    finally:
        if close_session:
            session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed LeadFlow demo data.")
    parser.add_argument("--reset", action="store_true", help="Wipe database before seeding")
    args = parser.parse_args()
    seed_db(reset=args.reset)
