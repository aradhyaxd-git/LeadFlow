# Architecture

## Overview

```
Browser (Next.js)  --JSON/HTTP-->  FastAPI  --SQLAlchemy-->  PostgreSQL
 TanStack Query                    routers -> services -> repositories
```

Single-screen app: one page, two dialogs (lead timeline, add lead). All state that comes from the server is owned by TanStack Query; local `useState` holds UI-only state (open dialog, active filter, search text).

## Data model

**Lead**

| Field | Type | Notes |
|---|---|---|
| id | int PK | |
| name | text, not null | trimmed, 1-120 chars |
| company | text, null | |
| phone | text, null | |
| status | enum | `new`, `contacted`, `qualified`, `proposal_sent`, `won`, `lost`; default `new` |
| follow_up_at | timestamptz, null | denormalised "next follow-up"; indexed |
| created_at | timestamptz | server default now() |

**Discussion**

| Field | Type | Notes |
|---|---|---|
| id | int PK | |
| lead_id | FK -> lead, `ON DELETE CASCADE` | |
| note | text, not null | 1-2000 chars |
| follow_up_at | timestamptz, null | the follow-up set by this note, kept for history |
| kind | enum | `note` (user) or `system` (e.g. "Lead created.") |
| created_at | timestamptz | server default now() |

Index: `(lead_id, created_at DESC)` for timeline reads.

## Business rules

1. **Creating a lead** also inserts a `system` discussion ("Lead created.") in the same transaction, so every lead has a last note and a time-ago from the start.
2. **Adding a discussion** with `follow_up_at` sets `lead.follow_up_at` in the same transaction. A note *without* a follow-up leaves the existing follow-up untouched.
3. **Clearing a follow-up** ("mark done") is explicit: `DELETE /leads/{id}/follow-up`.
4. `follow_up_at` must not be in the past (5-minute grace for clock skew) when set through the API; otherwise `422`.
5. **Pinned follow-ups** = leads whose follow-up is today or overdue, excluding `won` and `lost`. Overdue ones render red.
6. List ordering: most recent discussion first.

## Time handling

All timestamps are stored and transmitted as **UTC ISO-8601**. SQLite has no timezone-aware type, so a `UTCDateTime` `TypeDecorator` normalises values to UTC on write and re-attaches UTC on read; Postgres uses `timestamptz` natively. "Today", "overdue" and "time ago" are computed in the **browser's local timezone** by pure functions in `frontend/src/lib/time.ts` (unit-tested). The server never decides what "today" means, which avoids the classic server-vs-user timezone bug.

## Backend layout

```
backend/app/
  main.py          app factory, CORS, exception handlers
  config.py        pydantic-settings (all env access)
  db.py            engine + session dependency
  models.py        SQLAlchemy entities and enums
  schemas.py       Pydantic DTOs (requests/responses)
  errors.py        domain exceptions
  repositories/    all queries
  services/        business rules (transactions live here)
  routers/         HTTP only: parse -> call service -> return
  seed.py          idempotent seed
backend/tests/
```

Principles: routers never touch the ORM; services own transactions and rules; repositories own queries; DTOs are separate from models; domain exceptions are mapped to HTTP responses in one place. The list endpoint computes `last_note` / `last_discussion_at` with correlated scalar subqueries inside a single query, which avoids N+1 and compiles on both SQLite and Postgres (no Postgres-only SQL anywhere).

## Frontend layout

```
frontend/src/
  app/             page + layout only
  components/      presentational, no data fetching
  features/leads/  LeadList, LeadCard, FilterBar, LeadDialog (Timeline, NoteForm), AddLeadDialog, hooks
  lib/api.ts       the only place that calls fetch (typed)
  lib/time.ts      is-today, is-overdue, time-ago (pure)
  types/           API types (generated from OpenAPI where practical)
```

Mutations use optimistic updates with rollback and a toast on failure.

## Decision log

| Decision | Why |
|---|---|
| SQLite by default, PostgreSQL via `DATABASE_URL` (Neon or Compose) | Zero-setup for reviewers without Docker; same code on both. A `UTCDateTime` type decorator keeps datetimes tz-aware UTC on SQLite |
| No auth | Optional in the brief; avoids setup friction for reviewers |
| Denormalised `lead.follow_up_at` | Brief states the lead's follow-up field is updated; makes pinned queries trivial |
| Pinning computed client-side | Correct "today" in the user's timezone |
| Explicit "mark follow-up done" | Prevents stale follow-ups showing overdue forever without surprising users who log unrelated notes |
| Create tables on startup | Avoids migration tooling for a single-screen assessment; noted as a limitation |

## Known limitations / next steps

Authentication and per-user scoping, pagination, Alembic migrations, status-change history in the timeline, edit/delete of notes and leads.