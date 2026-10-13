# AI Usage Disclosure

PravarAI asked for clarity on all AI-assisted output. This file is the record.

## Tool

- Claude (Anthropic): planning conversation and the specification documents (README, ARCHITECTURE, docs/*, AGENTS.md)
- Google Antigravity (agentic IDE): implementation, driven phase by phase from `docs/IMPLEMENTATION_PLAN.md`
*(Update this list to match what you actually used.)*

## What AI did

- Proposed the architecture, data model and API contract (see ARCHITECTURE.md, docs/API.md) in a planning conversation before any code was written
- Generated first drafts of: backend (models, schemas, repositories, services, routers, seed, tests), frontend (components, hooks, API client, time utilities), Docker Compose files, and documentation
- Wrote commit messages where the tool was used to commit

## What I did

- Chose the stack, scope (no auth, no pagination) and the product rules (follow-up behaviour, pinning, overdue handling)
- Reviewed every file, ran the app, and exercised each flow manually
- Ran and read the tests and the linters
- Edited AI output where I disagreed. *(Fill in specifics here before submitting, for example: "changed X because Y".)*

## Verification

- Backend API tests (`make test`) cover status codes, ordering, follow-up propagation, 404 and 422 cases
- Frontend unit tests cover the date logic (today, overdue, time-ago)
- Manual walkthrough of all flows in the browser at desktop and mobile widths

## Things I can explain without the AI

*(Before submitting, list the parts you are confident walking through in an interview, for example the follow-up transaction, the timezone approach and the N+1-free list query.)*