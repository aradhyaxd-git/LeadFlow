# LeadFlow

A lightweight, single-screen CRM for sales reps: track leads, log every discussion, and never miss a follow-up.

Built for the PravarAI coding assessment. **Stack:** Next.js (App Router, TypeScript, Tailwind) · FastAPI · SQLAlchemy 2 · SQLite by default, PostgreSQL (Neon / Docker Compose) via one env var.

> **Status:** Complete and verified (`make lint`, `make test`, `make seed`). Design and behaviour specs: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md), [docs/API.md](docs/API.md), [docs/UI_SPEC.md](docs/UI_SPEC.md).

## Features

- **Lead list** with name, company, status badge, last note and time since last discussion
- **Today's follow-ups pinned** at the top; **overdue follow-ups highlighted in red**
- **Filter by status** (New / Contacted / Qualified / Proposal Sent / Won / Lost) and **search by name**
- **Lead timeline dialog** (no page navigation): full history, newest first; add a note with an optional follow-up date and time; change status; mark a follow-up done
- **Add new lead** (name required; company and phone optional; status defaults to New)
- Optimistic updates: saving a note updates the timeline and the list immediately
- Idempotent seed script with 6 leads and realistic discussions

## Quick start (no Docker needed)

Prerequisites: Python 3.9+, Node.js 18+.

### 1. Backend (Terminal 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
python -m app.seed              # Seed 6 demo leads
uvicorn app.main:app --reload --port 8000
```
- API is running at: http://localhost:8000
- Interactive Swagger docs: http://localhost:8000/docs
- Uses local SQLite database (`backend/leadflow.db`) by default.

### 2. Frontend (Terminal 2)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
- App is running at: http://localhost:3000

---

### Alternative: Using `make` (shortcut)

If you prefer using `make`:
```bash
make setup          # Creates backend venv, installs all deps, copies .env examples
make seed           # Seeds demo data
make dev-api        # Runs uvicorn backend on :8000
make dev-web        # Runs Next.js frontend on :3000
```

## Using PostgreSQL

### Neon (hosted)

Set `DATABASE_URL` in `backend/.env` to your Neon connection string with the SQLAlchemy driver prefix, then run the seed and API as above. No code changes.

```
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

### Docker Compose (optional)

Prerequisites: Docker 24+ with Compose v2.

```bash
cp .env.example .env
docker compose up --build
```

App at http://localhost:3000, API docs at http://localhost:8000/docs. Postgres runs in a container and is seeded on first start. Reset with `docker compose down -v`.

## Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | backend | `sqlite:///./leadflow.db` | SQLAlchemy connection URL |
| `CORS_ORIGINS` | backend | `http://localhost:3000` | Comma-separated allowed origins |
| `SEED_ON_START` | backend | `false` (`true` in Compose) | Seed demo data at startup if the DB is empty |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:8000/api/v1` | Where the browser calls the API |

## Tests and checks

Run tests:
```bash
# Backend pytest
cd backend && pytest

# Frontend vitest
cd frontend && npm test -- --run
```

Run linters and typechecks:
```bash
# Backend ruff
cd backend && ruff check .

# Frontend eslint & typescript
cd frontend && npm run lint && npx tsc --noEmit
```

*(Or via Makefile shortcuts: `make test` and `make lint`)*

The backend suite runs on SQLite; set `DATABASE_URL` to a Postgres URL to run it there too (see [docs/TESTING.md](docs/TESTING.md)).

## Project structure

```
backend/    FastAPI app (routers -> services -> repositories), tests, seed
frontend/   Next.js app (features/leads, components, lib)
docs/       Product spec, API, UI spec, testing, implementation plan
```

## Scope and trade-offs

Deliberately **out of scope**, with the reasoning:

- **Authentication.** Optional in the brief. The API is open; it would be added as a single FastAPI dependency plus an `owner_id` column.
- **Pagination.** Not needed at this data size. The list is a single repository query, so adding cursor pagination is a small change.
- **Migrations.** Tables are created on startup. A production deployment would use Alembic.
- **Real-time sync.** Single-user workflow; refetch-on-focus is enough.

## AI usage

See [AI_USAGE.md](AI_USAGE.md).