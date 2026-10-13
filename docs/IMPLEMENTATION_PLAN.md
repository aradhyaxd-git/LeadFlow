# Implementation Plan

Work in phases, in order. One phase per agent conversation keeps context small and the commit history clean. Each phase lists goal, tasks, a commit message, "Done when" checks, and a ready-to-paste prompt.

**Global preface for every prompt** (paste before the phase prompt, or rely on `AGENTS.md` being loaded):
> Read AGENTS.md and the docs it lists. Work only on this phase. Plan first, then implement. Run the checks and report their real output. Do not start the next phase.

Target layout:

```
leadflow/
  backend/{app/,tests/,pyproject.toml,requirements.txt,requirements-dev.txt,.env.example,Dockerfile}
  frontend/{src/,package.json,.env.example,Dockerfile,...}
  docker-compose.yml  Makefile  .gitignore  .env.example
```

---

## Phase 0: Scaffold
**Goal:** empty but runnable skeleton with tooling.
**Tasks:** monorepo dirs; `.gitignore` (venv, node_modules, `.env*` except examples, `*.db`, `.next`, `__pycache__`); `Makefile` with the targets in AGENTS.md (`make setup` also copies each `.env.example` to `.env` / `.env.local` if missing); backend `pyproject.toml` (ruff + pytest config), `requirements*.txt`, `GET /api/v1/health`; `create-next-app` (TS, Tailwind, App Router, src dir, ESLint); Vitest set up; `.env.example` files.
**Commit:** `chore: scaffold backend, frontend and tooling`
**Done when:** `make setup`, `make dev-api` (health returns 200), `make dev-web` (default page loads), `make lint` and `make test` run (even if there are 0 or 1 tests).
**Prompt:** "Execute Phase 0 of docs/IMPLEMENTATION_PLAN.md. Pin exact dependency versions you install and record them in the requirements files and package.json."

## Phase 1: Backend core
**Goal:** the full API from `docs/API.md`, layered per `AGENTS.md`.
**Tasks:** `config.py`; `db.py` (engine from `DATABASE_URL`, SQLite needs `check_same_thread=False`, session dependency, create tables on startup); `UTCDateTime` TypeDecorator; `models.py` (Lead, Discussion, enums, indexes, FK cascade, SQLite FK pragma on); `schemas.py` (trim and validate strings; `follow_up_at` aware datetime; past-date check with 5-minute grace); `errors.py`; repositories (list with status/q filters and correlated subqueries for last note and last discussion time); services (create_lead adds system note in one transaction; add_discussion updates follow-up in same transaction; update_status; clear_follow_up); routers; exception handlers (domain errors, validation errors reshaped to the standard envelope, unhandled -> 500 generic); CORS from settings.
**Commit:** `feat(api): leads, discussions, status and follow-up endpoints`
**Done when:** all endpoints in `docs/API.md` work via `/docs`; `ruff` clean.
**Prompt:** "Execute Phase 1. Follow the layering rules strictly. Keep SQL portable between SQLite and Postgres. Return the exact JSON shapes in docs/API.md."

## Phase 2: Backend tests
**Goal:** the matrix in `docs/TESTING.md`.
**Tasks:** `conftest.py` with temp-SQLite engine per test and dependency override; one test per matrix row, named after the behaviour; atomicity test by monkeypatching the repository call that updates the lead.
**Commit:** `test(api): cover endpoints, business rules and error shapes`
**Done when:** `make test` green, you have read the output. Then run once with `DATABASE_URL` pointing at Postgres (Neon) and note the result in `docs/OPEN_QUESTIONS.md` if skipped.
**Prompt:** "Execute Phase 2. Do not change application code to make tests pass unless you found a real bug; if so, say which."

## Phase 3: Seed
**Goal:** idempotent seed matching `docs/PRODUCT_SPEC.md`.
**Tasks:** `python -m app.seed`; times relative to run time; skip if leads already exist (or `--reset` flag to wipe and reseed); startup option `SEED_ON_START=true` (default false locally, true in Compose); test for idempotency.
**Commit:** `feat(seed): idempotent demo data`
**Done when:** seed twice yields exactly 6 leads; Sarah due in about 3 hours, Bill overdue.
**Prompt:** "Execute Phase 3."

## Phase 4: Frontend foundation
**Goal:** typed data layer and the pure time logic, before any UI.
**Tasks:** tokens in `globals.css` and Tailwind theme per `docs/UI_SPEC.md`; Inter via `next/font`; `types/` (Lead, Discussion, LeadStatus const + labels); `lib/api.ts` (typed fetch wrapper, error envelope -> `ApiError`); `lib/time.ts` (`timeAgo`, `isToday`, `isOverdue`, `formatFollowUp`, `describeFollowUp`); `lib/leads.ts` (`groupLeads`: pinned vs rest, sorting, counts); QueryClient provider; hooks `useLeads`, `useLead`, `useAddDiscussion`, `useUpdateStatus`, `useCreateLead`, `useClearFollowUp`.
**Commit:** `feat(web): api client, time utilities and query hooks`
**Done when:** Vitest passes the cases in `docs/TESTING.md` for `time.ts` and grouping.
**Prompt:** "Execute Phase 4. No UI components yet. Inject `now` as a parameter into time functions so they are testable."

## Phase 5: List, filters, search, pinned
**Goal:** AC-1 to AC-7, AC-19 (list states).
**Tasks:** `Header`, `FilterBar`, `SearchInput`, `LeadCard`, `StatusBadge`, `PinnedSection`, `LeadList`, skeleton, empty and error states; URL-synced filter and search (`?status=&q=`).
**Commit:** `feat(web): lead list with filters, search and pinned follow-ups`
**Done when:** with the API running and seeded, manual checks 1 and 2 pass; component tests for filter chips.
**Prompt:** "Execute Phase 5 following docs/UI_SPEC.md. Components stay presentational; data comes from hooks."

## Phase 6: Timeline dialog
**Goal:** AC-8 to AC-15.
**Tasks:** `LeadDialog` (Radix), `Timeline`, `NoteForm` (validation, quick chips, Cmd/Ctrl+Enter), status select, "Mark done", optimistic update with rollback and toast, list cache updated from the mutation response.
**Commit:** `feat(web): lead timeline dialog with notes, follow-ups and status`
**Done when:** manual checks 3 to 8 pass; component test for form validation.
**Prompt:** "Execute Phase 6. Use optimistic updates and roll back on error. Update the list cache so the row changes behind the dialog immediately."

## Phase 7: Add lead
**Goal:** AC-16 to AC-18.
**Commit:** `feat(web): add new lead dialog`
**Done when:** manual check 9 passes.
**Prompt:** "Execute Phase 7."

## Phase 8: Polish and accessibility
**Goal:** AC-19 to AC-21.
**Tasks:** toasts; responsive (bottom-sheet dialog on mobile); keyboard pass; contrast verification of every badge pair; reduced motion; `Cmd/Ctrl+K` search focus; favicon and title.
**Commit:** `feat(web): polish, accessibility and responsive layout`
**Done when:** manual checks 10 to 13 pass; screenshots at 1440px and 390px saved to `docs/screenshots/` and linked from the README.
**Prompt:** "Execute Phase 8. Verify contrast numerically, not by eye."

## Phase 9: Docker Compose (bonus)
**Goal:** `docker compose up --build` runs the full stack on Postgres with seed.
**Tasks:** backend and frontend Dockerfiles (multi-stage, non-root); Postgres service with healthcheck; backend waits on healthy DB; `SEED_ON_START=true`; `NEXT_PUBLIC_API_URL` build arg; root `.env.example`.
**Commit:** `chore: docker compose setup`
**Done when:** it runs, or if Docker is unavailable it is clearly marked "untested" in the README and in `docs/OPEN_QUESTIONS.md`.
**Prompt:** "Execute Phase 9. If you cannot run Docker, say so; do not claim it works."

## Phase 10: Docs and submission
**Tasks:** update README (verified commands, screenshots), `ARCHITECTURE.md`, `docs/API.md` to match the final code; fill `AI_USAGE.md` (the owner does the personal parts); final full run of `make lint`, `make test`, manual checklist; clean git history check; tag `v1.0.0`.
**Commit:** `docs: finalise README, architecture and AI usage`

### Submission checklist
- [ ] README setup steps followed on a clean clone, by a human, with no Docker
- [ ] `make lint` and `make test` green (and once on Postgres)
- [ ] Every evaluation-matrix item demonstrable in under 3 minutes
- [ ] No secrets or `.db` files in git (`git log -p | grep -i "postgresql+psycopg://"` returns nothing)
- [ ] Commit history reads as a story, with conventional messages
- [ ] `AI_USAGE.md` completed in your own words; you can explain every file