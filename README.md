# LeadFlow — High-Velocity Sales CRM

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1_App_Router-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0_Typed-red?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.7-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4_Jira_Aesthetic-38bdf8?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-23_Passing_(14_Pytest_+_9_Vitest)-brightgreen?style=flat)](#testing--verification)

> A lightweight, single-screen CRM engineered for sales reps: track high-intent leads, log discussion timelines, manage pipeline stages, and never miss a scheduled follow-up.

---

## 1. Executive Summary

LeadFlow is built on the philosophy of **zero-friction sales velocity**. Traditional CRMs burden reps with multi-page navigations, slow round-trips, and bloated forms. LeadFlow collapses the entire sales workflow onto a single viewport:
- **Instant Context**: Immediate visibility into lead status, latest discussion notes, and relative time-ago.
- **Action-Oriented Reminders**: Actionable follow-ups due today and overdue leads are pinned to the top and highlighted.
- **Deep Activity History**: Reverse-chronological timeline dialog with note logging, follow-up scheduling, and stage switching without page reloads.
- **Jira-Inspired Craft**: Tactile design system styled with Atlassian Blue accents (`#0052cc`), status lozenges, keyboard navigation (`⌘K`, `⌘ + Enter`), and Kanban board toggle.

---

## 2. Feature Walkthrough

### 2.1 Lead Pipeline (List/Grid & Kanban Views)
- **Dual View Modes**: Switch seamlessly between a dense List/Grid view and an interactive multi-stage **Kanban Board** (`New` → `Contacted` → `Qualified` → `Proposal Sent` → `Won` → `Lost`).
- **Pipeline KPI Metrics**: Live summary cards tracking Total Leads, Due Today, Overdue, and Deals Won.
- **Search & Filtering**: Search across lead names and companies in real-time, filtered by stage lozenges with live counters. Bound to the global `⌘K` keyboard shortcut.

### 2.2 Follow-up Reminders & Notification Bell
- **Pinned Attention Bar**: Leads with follow-ups scheduled for today or overdue are automatically pinned to the top. Overdue leads are surfaced with rose alert badges (`Overdue by X days`).
- **Interactive Reminders Bell**: Top navigation bell features a live counter badge. Clicking opens a dropdown popover listing pending follow-ups with instant deep-linking to the lead dialog.

### 2.3 Lead Timeline Dialog & Activity History
- **Modal Engagement**: Radix UI accessible modal ensures keyboard focus trap and zero scroll jumping.
- **Activity Stream**: Reverse-chronological discussion stream with aligned vertical spine, user avatars, and system notes.
- **Discussion Logger**: Multi-line note logger supporting keyboard submission (`⌘ + Enter`) and quick-pick presets (`Tomorrow 10 AM`, `In 3 days`, `Next week`).
- **Validation**: Enforces non-empty notes and rejects follow-ups in the past (>5 minutes) with inline feedback.
- **Quick Actions**: Mark follow-up done with one click, or generate a **Google Meet** calendar event pre-filled with the lead's discussion context.

### 2.4 Quick Pipeline Operations
- **Quick Stage Advancement**: Advance leads through pipeline stages directly from card hover buttons.
- **CSV Export**: Client-side CSV generator exports filtered pipeline leads with full timestamp metadata.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend Framework** | Python 3.9+ / 3.12, **FastAPI**, Pydantic v2 | High-throughput asynchronous HTTP handling with automatic OpenAPI contract generation. |
| **ORM & Data Layer** | **SQLAlchemy 2.x** (`Mapped[]`), Psycopg 3 | Fully typed declarative models, atomic transaction handling, and portable query compilation. |
| **Database** | **SQLite** (local default) / **PostgreSQL** (Neon/Compose) | Zero-setup local development with seamless one-variable production transition via `DATABASE_URL`. |
| **Frontend Framework** | **Next.js 15** (App Router, React 19, TypeScript) | Modern React architecture with optimized client components and zero routing waterfalls. |
| **Server State** | **TanStack Query v5** (`@tanstack/react-query`) | Optimistic mutation updates, automatic cache invalidation, and background synchronization. |
| **UI Components & Style** | **Tailwind CSS**, **Radix UI Dialog**, Lucide Icons | Accessible dialog portals, custom Jira lozenges, and responsive mobile-first layouts. |
| **Testing** | **Pytest** + **HTTPX**, **Vitest** + React Testing Library | Full-stack test isolation with in-memory SQLite and isolated component unit tests. |

---

## 4. Quick Start

### Prerequisites
- Python 3.9+ (Python 3.12 recommended)
- Node.js 18+ and npm

### Local Development (Zero Docker Required)

#### Terminal 1 — Backend API
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
python -m app.seed              # Seeds 6 realistic demo leads
uvicorn app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000/api/v1`
- Swagger Docs: `http://localhost:8000/docs`
- Database: Local SQLite file (`backend/leadflow.db`)

#### Terminal 2 — Frontend Web
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
- Dashboard URL: `http://localhost:3000`

---

### Alternative: Docker Compose (Full Stack on PostgreSQL)

```bash
docker compose up --build
```
Spins up:
- Next.js frontend on `http://localhost:3000`
- FastAPI backend on `http://localhost:8000`
- PostgreSQL 16 database with auto-seeding on startup

---

## 5. API Specification Overview

All endpoints return data adhering to the uniform envelope specification documented in [`docs/API.md`](docs/API.md):

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/v1/health` | Service health check | `200` |
| `GET` | `/api/v1/leads` | List leads (supports `status`, `q` search query) | `200` |
| `POST` | `/api/v1/leads` | Create lead (atomically logs system note) | `201`, `422` |
| `GET` | `/api/v1/leads/{id}` | Get lead detail with full discussion history | `200`, `404` |
| `POST` | `/api/v1/leads/{id}/discussions` | Add discussion note + optional follow-up | `201`, `404`, `422` |
| `PATCH` | `/api/v1/leads/{id}/status` | Update lead pipeline status | `200`, `404`, `422` |
| `DELETE` | `/api/v1/leads/{id}/follow-up` | Mark follow-up as completed / clear reminder | `200`, `404` |

---

## 6. Testing & Verification

The codebase is backed by **23 automated tests** covering core API contracts, edge cases, date boundaries, and UI components:

```bash
# 1. Run backend integration tests (14 tests)
cd backend && .venv/bin/pytest

# 2. Run frontend unit tests (9 tests)
cd frontend && npm test -- --run

# 3. Run linting & TypeScript verification
cd frontend && npm run lint && npx tsc --noEmit
cd backend && .venv/bin/ruff check .
```

### Backend Test Coverage Highlights (`pytest`)
- `test_create_lead_creates_system_discussion`: Atomicity of initial system note.
- `test_note_with_past_follow_up_rejected`: Rejection of follow-ups >5 minutes in the past.
- `test_add_discussion_atomicity_on_failure`: Rollback verification if lead update fails mid-transaction.
- `test_clear_follow_up_marks_done`: Clearing reminder while preserving full discussion history.
- `test_seed_is_idempotent`: Verifies duplicate seed runs maintain exactly 6 unique leads.

### Frontend Test Coverage Highlights (`vitest`)
- `time.test.ts`: Exhaustive day-boundary testing (`23:59` vs `00:00`), relative time intervals, and overdue calculations.
- `leads.test.ts`: Pinning logic, Won/Lost exclusion, and deduplication between pinned and active lists.
- `components.test.tsx`: FilterBar status changes, NoteForm validations, and Header notification bell dropdown interactions.

---

## 7. Keyboard Navigation & Accessibility (a11y)

- `⌘K` / `Ctrl+K`: Focus global lead search input immediately.
- `⌘ + Enter` / `Ctrl + Enter`: Save and submit new discussion note in dialog.
- `Tab` & `Shift + Tab`: Predictable logical focus trapping in modal dialogs.
- `Esc`: Dismiss dialogs, search inputs, or notification dropdowns.
- High-contrast APCA/WCAG compliant status lozenges.
- Screen-reader accessible toasts powered by `aria-live="polite"`.

---

## 8. Architectural Highlights

For detailed system design decisions, data dictionary, and portability constraints, refer to:
👉 [**ARCHITECTURE.md**](ARCHITECTURE.md)