# System Architecture & Technical Specifications

> **LeadFlow** — Single-screen, high-velocity CRM engineered for zero-friction sales rep workflows.

---

## 1. High-Level Architecture

LeadFlow follows a strict **Domain-Driven Layered Architecture** on the backend and a **Reactive, Cache-Driven Component Architecture** on the frontend. The entire application operates on a single viewport without destructive page reloads or routing latency.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (Next.js 15)                     │
│   Dashboard View (Grid / Kanban)  │  Dialog Portals (Radix UI)             │
│   TanStack Query Cache (v5)        │  Pure Time Calculations (Local Time) │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTP / JSON (RESTful API v1)
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI SERVICE LAYER                           │
│   Routers (HTTP parsing, DTO schema validation, error envelope mapper)    │
│   Domain Services (Business logic, multi-entity atomic transactions)       │
│   Repositories (Correlated scalar subqueries, zero N+1 queries)           │
│   Typed ORM Models (SQLAlchemy 2.x Mapped[], UTCDateTime decorator)       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ Dialect-agnostic SQL
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          PERSISTENCE LAYER                                │
│   SQLite (Default zero-config local engine: `leadflow.db`)                │
│   PostgreSQL (Production / Neon / Docker Compose via `DATABASE_URL`)       │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Strict Separation of Concerns (Backend)
- **Routers (`app/routers/leads.py`)**: Responsible solely for HTTP deserialization, Pydantic DTO validation, invoking domain services, and returning status codes. Routers never import database sessions or ORM models.
- **Domain Services (`app/services/lead_service.py`)**: Pure business logic orchestrator. Manages transaction lifecycles, atomic dual-writes, domain validation (e.g. rejection of past follow-up dates), and emits domain exceptions.
- **Repositories (`app/repositories/lead_repository.py`)**: Encapsulates raw SQLAlchemy queries. Exposes high-level query methods. Uses correlated scalar subqueries to compute aggregated discussion metadata in a single round-trip without N+1 query overhead.
- **Models & Types (`app/models.py`)**: SQLAlchemy 2.0 type-annotated (`Mapped[...]`) declarative entities with foreign key cascading and composite indices.
- **Unified Error Envelope**: All domain and validation exceptions are mapped by a centralized exception handler in `main.py` to a RFC-compliant JSON envelope (`{"error": {"code": "...", "message": "...", "details": ...}}`).

### 2.2 Database Portability (Zero Dialect Lock-in)
The system is engineered to run seamlessly across both development/test environments (SQLite) and production scale (PostgreSQL/Neon) with **zero code changes**:
- Prohibits Postgres-specific constructs (e.g., `ILIKE`, `DISTINCT ON`, lateral joins).
- Utilizes portable SQLAlchemy constructs: `func.lower(column).like(...)`, correlated subqueries, and standard outer joins.
- Solves SQLite's lack of timezone awareness via a custom `UTCDateTime` `TypeDecorator` that enforces UTC normalization on write and re-attaches UTC tzinfo on read.

---

## 3. Data Model & Schema Design

### 3.1 Entity-Relationship Diagram

```
┌────────────────────────────────────────┐
│                 LEADS                  │
├────────────────────────────────────────┤
│ PK  id               INTEGER           │
│     name             VARCHAR(120)      │
│     company          VARCHAR(120) NULL │
│     phone            VARCHAR(40) NULL  │
│     status           VARCHAR(30)       │
│     follow_up_at     TIMESTAMPTZ NULL  │  ◀── Denormalized for O(1) query indexing
│     created_at       TIMESTAMPTZ       │
└──────────────────┬─────────────────────┘
                   │ 1
                   │
                   │ has many (CASCADE DELETE)
                   │
                   │ N
┌──────────────────▼─────────────────────┐
│              DISCUSSIONS               │
├────────────────────────────────────────┤
│ PK  id               INTEGER           │
│ FK  lead_id          INTEGER           │
│     note             TEXT              │
│     follow_up_at     TIMESTAMPTZ NULL  │  ◀── Point-in-time follow-up snapshot
│     kind             VARCHAR(20)       │  ◀── 'system' | 'note'
│     created_at       TIMESTAMPTZ       │
└────────────────────────────────────────┘
```

### 3.2 Indexing Strategy
1. `leads.follow_up_at`: B-tree index enabling immediate lookup of due and overdue reminders.
2. `discussions.(lead_id, created_at DESC)`: Composite index optimizing reverse-chronological timeline retrieval and correlated subquery lookups.

---

## 4. Key Business Invariants & Transaction Semantics

| Rule ID | Invariant | Technical Implementation |
|---|---|---|
| **INV-01** | **Initial Discussion Guarantee** | Creating a lead automatically writes a `"Lead created."` system discussion in the same atomic database transaction. |
| **INV-02** | **Follow-up State Propagation** | Logging a discussion with a follow-up timestamp updates `lead.follow_up_at` atomically. If the follow-up is omitted, the lead's existing reminder is preserved. |
| **INV-03** | **Clock-Skew Past Rejection** | Any follow-up timestamp more than 5 minutes in the past is rejected with HTTP `422 Unprocessable Content`. |
| **INV-04** | **Explicit Completion** | Follow-ups are cleared only via explicit user action (`DELETE /api/v1/leads/{id}/follow-up`), decoupling discussion logging from premature task closure. |
| **INV-05** | **Client-Side Day Boundary Resolution** | The backend stores and transmits pure UTC ISO-8601 strings. Whether a follow-up is "Due Today", "Overdue", or "Upcoming" is computed strictly in the client's local timezone. |

---

## 5. Frontend Architecture & State Management

### 5.1 Reactive State Flow
```
User Action (e.g. Log Note)
     │
     ▼
TanStack Query Mutation (`useAddNote`)
     │
     ├─► [1] Optimistic UI Update: Query cache patched with temporary discussion & follow-up
     ├─► [2] Background API Call: POST /api/v1/leads/{id}/discussions
     │        │
     │        ├─► Success: Invalidate & refetch `["leads"]` and `["lead", id]`
     │        └─► Failure: Rollback cache to previous snapshot + trigger Toast error
     ▼
UI re-renders instantaneously with zero latency
```

### 5.2 Component Hierarchy
- **`app/page.tsx`**: Central orchestrator controlling filter state, search query, modal open state, and view mode (Grid vs. Kanban).
- **`components/Header.tsx`**: Unified navigation bar housing breadcrumbs, view switcher, CSV export, and active notification bell with dropdown popover.
- **`features/leads/PipelineMetrics.tsx`**: KPI cards displaying Total Leads, Due Today, Overdue, and Won counts.
- **`features/leads/FilterBar.tsx`**: Quick filter lozenges with live counts and search input (bound to ⌘K).
- **`features/leads/PinnedSection.tsx`**: Pinned container highlighting actionable leads due today or overdue.
- **`features/leads/LeadDialog.tsx` & `Timeline.tsx`**: Radix UI modal presenting reverse-chronological activity history with centered spine and note logging form.

---

## 6. Non-Functional Requirements & Verification

- **Latency & Performance**: Correlated scalar subqueries eliminate N+1 queries. Single network call returns complete lead summaries with latest note and timestamp.
- **Portability**: Verified on SQLite (in-memory & file) and PostgreSQL (Neon serverless).
- **Accessibility (a11y)**: Focus trap in modals via Radix UI Dialog, visible focus rings, high-contrast badges (APCA/WCAG compliant), `aria-live` regions for toasts, keyboard shortcuts (`⌘K` to search, `⌘ + Enter` to save note, `Esc` to close).
- **Test Coverage**:
  - Backend: 14 pytest integration tests covering happy paths, validation edges, atomic rollbacks, and seed idempotency.
  - Frontend: 9 Vitest unit tests covering date math, timezone boundaries, lead grouping, and component interactions.