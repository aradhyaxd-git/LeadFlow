# Product Spec

**Product:** LeadFlow, a single-screen lead management tool for a sales rep.
**Source:** PravarAI coding assessment brief. Wireframes in the brief are suggestions; layout may change as long as the flows work.

## Goals

A rep can see every lead and its status at a glance, never miss a follow-up, keep a full history of discussions per lead, and add leads quickly.

## Non-goals

Authentication, multi-user, pagination, editing or deleting notes or leads, email/calendar integration, notifications.

## Users and stories

| ID | Story |
|---|---|
| L1 | As a rep I see all leads with name, company, status badge, last note and time since last discussion |
| L2 | As a rep I see leads with a follow-up due today pinned at the top, and overdue ones highlighted in red |
| L3 | As a rep I filter by status and search by name |
| T1 | As a rep I click a lead and a dialog opens (no navigation) with its full discussion history, newest first |
| T2 | As a rep I add a note with an optional follow-up date and time |
| T3 | As a rep I see the list update immediately after saving a note |
| T4 | As a rep I change a lead's status from the dialog and it persists |
| T5 | As a rep I mark a follow-up as done |
| A1 | As a rep I add a lead with a required name, optional company and phone; status defaults to New |

## Acceptance criteria

Each criterion maps to the assessment's evaluation matrix.

**Lead list (L1-L3)**
- AC-1: Each row shows name, company (if any), status badge, last note (truncated with ellipsis), and relative time of the last discussion ("2 hours ago", "1 week ago")
- AC-2: A "Today's follow-ups" section is shown above "All leads" only when at least one lead is due today or overdue and is not Won or Lost
- AC-3: Overdue follow-ups (before now) appear in that section with red styling and text like "Overdue by 2 days"; today's show "Follow-up today at 2:00 PM"
- AC-4: A lead shown in the pinned section is not duplicated in "All leads"
- AC-5: Filter chips (All, New, Contacted, Qualified, Proposal Sent, Won, Lost) filter the list; the active chip is visually distinct; chips show counts
- AC-6: Search matches names case-insensitively and combines with the status filter
- AC-7: Won and Lost leads render visually de-emphasised

**Timeline dialog (T1-T5)**
- AC-8: Clicking (or pressing Enter on) a lead opens a modal dialog; Esc and the close button dismiss it and return focus to the row
- AC-9: The timeline lists discussions newest first, each with absolute timestamp and relative time; system entries are visually distinct (italic)
- AC-10: A discussion with a follow-up shows a "Follow-up set for ..." chip
- AC-11: The note form has a textarea, a "Set follow-up" checkbox, and date and time inputs enabled only when checked; quick-pick chips (Tomorrow, In 3 days, Next week) fill the fields
- AC-12: Saving with an empty note is blocked with an inline error. A follow-up in the past is blocked with an inline error
- AC-13: On save, the new note appears at the top of the timeline and the list row (last note, time ago, follow-up) updates without a manual refresh
- AC-14: Changing the status in the dialog saves immediately, updates the badge in the list, and survives a page reload
- AC-15: A lead's current follow-up is shown in the dialog header with a "Mark done" action that clears it everywhere

**Add lead (A1)**
- AC-16: "Add New Lead" opens a modal with Full name (required), Company, Phone
- AC-17: Submitting with a blank name shows an inline error and does not call the API
- AC-18: A created lead appears in the list immediately with status New and a "Lead created." note

**Quality**
- AC-19: Loading, empty (no leads; no matches) and error states are all designed
- AC-20: Works at 360px to 1920px widths; the dialog is usable on mobile
- AC-21: Fully keyboard operable; visible focus; all form controls labelled

## Business rules

See `ARCHITECTURE.md` -> Business rules. In short: creating a lead adds a system note; a note with a follow-up updates the lead's follow-up; a note without one leaves it unchanged; "mark done" clears it; past follow-ups rejected; pinned = today or overdue, not Won/Lost; "today" is the browser's local day.

## Seed data (minimum 5 leads)

Seeded relative to run time so the demo always shows each state:

| Lead | Company | Status | Follow-up | Purpose |
|---|---|---|---|---|
| Sarah Connor | Acme Corp | proposal_sent | in about 3 hours | Today's follow-up; three-note timeline |
| Bill Lumbergh | Initech | contacted | 2 days ago | Overdue (red) |
| Hank Scorpio | Globex | new | none | Fresh inbound lead |
| Tony Stark | Stark Industries | qualified | tomorrow | Future follow-up, not pinned |
| Bruce Wayne | Wayne Enterprises | won | none | De-emphasised |
| Ellen Ripley | Weyland-Yutani | lost | none | De-emphasised |

The "today" slot is relative to the seed run time; running the seed within a few hours of local midnight may place it on the adjacent day.

## Open questions

Tracked in `docs/OPEN_QUESTIONS.md`.