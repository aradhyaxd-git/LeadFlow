# Testing Specification

## Backend Test Matrix (`pytest`)

Every test runs against an isolated temporary SQLite database via FastAPI `TestClient` dependency override.

| Test Name | Requirement Covered |
|---|---|
| `test_health_ok` | `GET /api/v1/health` returns `200 {"status": "ok"}` |
| `test_create_lead_creates_system_discussion` | Business rule 1: creating a lead inserts `"Lead created."` system note in the same transaction and returns 201 |
| `test_create_lead_validation_errors` | Blank name, whitespace-only name, or >120 chars returns `422` in standard error envelope |
| `test_list_leads_ordered_by_latest_discussion` | Business rule 6: list is ordered by most recent discussion first |
| `test_list_leads_filters_by_status_and_search` | `status` and `q` query params filter case-insensitively and combine |
| `test_get_lead_timeline_reverse_chronological` | `GET /api/v1/leads/{id}` returns discussions newest first; unknown id returns `404` |
| `test_note_with_follow_up_updates_lead` | Business rule 2: adding a discussion with `follow_up_at` updates `lead.follow_up_at` atomically |
| `test_note_without_follow_up_preserves_existing_follow_up` | Business rule 2: adding a discussion without `follow_up_at` leaves `lead.follow_up_at` untouched |
| `test_note_with_past_follow_up_rejected` | Business rule 4: `follow_up_at` more than 5 minutes in the past returns `422` |
| `test_add_discussion_atomicity_on_failure` | If updating the lead fails mid-transaction, the discussion note is rolled back |
| `test_update_lead_status_persists` | `PATCH /api/v1/leads/{id}/status` updates status; invalid status returns `422`; missing lead returns `404` |
| `test_clear_follow_up_marks_done` | Business rule 3: `DELETE /api/v1/leads/{id}/follow-up` sets `lead.follow_up_at = null` while preserving discussion history |
| `test_seed_is_idempotent` | Running `seed_db()` twice yields the exact same 6 leads without duplicates |

## Frontend Test Matrix (`vitest`)

| Suite | Cases Covered |
|---|---|
| `time.test.ts` | `isToday`, `isOverdue`, `timeAgo`, `describeFollowUp` across local midnight boundaries (`23:59` vs `00:00`), past, today, future timestamps |
| `leads.test.ts` | `groupLeads` pins today + overdue leads, excludes `won` and `lost` from pinned, prevents duplication in `allLeads`, computes status counts |
| `FilterBar.test.tsx` | Renders all status chips with counts, triggers status filter callback, updates search input |
| `NoteForm.test.tsx` | Blocks empty note submission with inline error, blocks past follow-up date with inline error, submits valid note + follow-up |

## Manual Verification Checklist

1. **Seed state**: Start API and web app; verify Sarah Connor is pinned as due today and Bill Lumbergh is pinned in red as overdue.
2. **Filter & search**: Click status chips and type in search box; verify URL params and list update immediately.
3. **Timeline dialog**: Click Sarah Connor; verify 3 discussions appear in reverse chronological order.
4. **Add discussion + follow-up**: Add a note with a new follow-up time; verify timeline and background card update immediately.
5. **Add discussion without follow-up**: Add a note without checking "Set Follow-up"; verify existing follow-up remains intact.
6. **Status update**: Change status in dialog; reload page and confirm status persisted.
7. **Mark follow-up done**: Click "Mark done" in dialog header; verify lead unpins from "Today's Follow-ups".
8. **Validation**: Try saving an empty note or past follow-up; verify inline error message.
9. **Add new lead**: Click `+ Add New Lead`, submit with name + company; verify new lead appears at top of list with `"Lead created."`.
10. **Keyboard & focus**: Navigate rows with `Tab`/`Enter`, close dialog with `Esc`, press `Cmd/Ctrl+K` to focus search.
11. **Responsive**: Verify layout at `1440px` desktop and `390px` mobile widths.
