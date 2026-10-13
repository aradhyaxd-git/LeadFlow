# AGENTS.md

Instructions for AI coding agents (Antigravity, Claude Code, Cursor, etc.) working in this repo. Humans: this is also a fair summary of how the code is meant to be written.

**Read first, in this order:** `docs/PRODUCT_SPEC.md` (what), `ARCHITECTURE.md` (how), `docs/API.md` (contract), `docs/UI_SPEC.md` (look and behaviour). If two docs disagree, `docs/API.md` wins for the contract and `docs/PRODUCT_SPEC.md` wins for behaviour. Fix the loser in the same commit.

## How to work

1. **Plan, then code.** State the plan (files to create or change) before writing code.
2. **Run the checks yourself** (`make lint`, `make test`) and read the output. Never claim something works without running it. If you could not run something, say so explicitly.
3. **Commit using conventional commits.** The app must run at every commit.
4. **Stay in scope.** Do not add auth, pagination, migrations, websockets or new dependencies that are not listed below.
5. **No invented facts.** Do not fabricate endpoints, fields or library APIs. If unsure about a library API, read its docs or the installed source.

## Stack (pinned choices)

| Area | Choice |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.x (typed, `Mapped[]`), Pydantic v2, pydantic-settings, psycopg 3 |
| DB | SQLite by default (`sqlite:///./leadflow.db`); PostgreSQL (Neon / Compose) via `DATABASE_URL`. Code must work on both |
| Backend tooling | pytest, httpx (TestClient), ruff |
| Frontend | Next.js (App Router), React, TypeScript strict, Tailwind CSS, TanStack Query, Radix UI Dialog, Vitest + React Testing Library |
| Packaging | Makefile, Dockerfiles + `docker-compose.yml` (bonus) |

## Commands

```bash
make setup      # create venv, install backend + frontend deps
make dev-api    # uvicorn on :8000
make dev-web    # next dev on :3000
make seed       # idempotent seed
make test       # backend pytest + frontend vitest
make lint       # ruff + eslint + tsc --noEmit
docker compose up --build   # full stack on Postgres (optional)
```

## Architecture rules (non-negotiable)

- **Layering:** `routers -> services -> repositories -> models`. Routers do HTTP only (parse, call a service, return). Services own business rules and transactions. Repositories own queries. Routers never import ORM models or sessions' query API.
- **DTOs:** request and response types are Pydantic schemas in `schemas.py`; never return ORM objects.
- **Errors:** raise domain exceptions from `errors.py`; one handler in `main.py` maps them to the error shape in `docs/API.md`. No `HTTPException` in services or repositories. No bare `except`.
- **Portability:** no Postgres-only SQL (no lateral joins, no `ILIKE`, no `DISTINCT ON`). Use SQLAlchemy constructs that compile on both (`func.lower(col).like(...)`, correlated scalar subqueries).
- **Time:** the database and the wire use UTC. A `UTCDateTime` `TypeDecorator` guarantees tz-aware UTC datetimes come back from SQLite as well as Postgres. "Today", "overdue" and "time ago" are computed **only** in `frontend/src/lib/time.ts`.
- **Frontend data:** all network calls go through `src/lib/api.ts`. Server state lives in TanStack Query hooks under `src/features/leads/hooks`. `useState` is for UI state only. Components in `src/components` are presentational and do not fetch.
- **Types:** TypeScript `strict`, no `any`, no non-null assertions without a comment. Python fully type-hinted, `ruff` clean.
- **Statuses** come from one enum per side (`LeadStatus` in Python, a `const` array + union in TS). No status string literals in logic.

## Code style

- Small single-purpose functions (aim for under 30 lines). Names carry the meaning (`is_overdue`, `get_todays_follow_ups`).
- Comments explain *why*, never *what*.
- No premature abstraction. Three similar lines beat a speculative helper.
- Prefer pure functions and immutability; push side effects to services and hooks.
- Accessibility is part of "done": keyboard operable, visible focus, labelled inputs, 4.5:1 contrast, `aria-live` for toasts.

## Testing expectations

- Every endpoint: happy path plus each documented error status.
- Business rules from `ARCHITECTURE.md` each have a named test (e.g. `test_note_with_follow_up_updates_lead`).
- `time.ts` is exhaustively unit tested including day boundaries and DST-free edge cases (23:59 / 00:00 local).
- Test against SQLite in CI-style runs; one run against Postgres is required before the final commit (see `docs/TESTING.md`).

## Git

Conventional commits, atomic, message body explains why. AI-assisted commits end with the trailer the tool is configured to add. Never commit `.env`, `*.db`, `node_modules`, `.venv`.

## Definition of done (every phase)

- [ ] Code matches docs; docs updated if behaviour changed
- [ ] `make lint` and `make test` pass (output read, not assumed)
- [ ] Manual check performed for UI phases (screenshots or a described walkthrough)
- [ ] Committed with a clear, concise commit message