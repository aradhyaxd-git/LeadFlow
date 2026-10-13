# API Specification

Base URL: `/api/v1`

All request and response bodies are JSON (`Content-Type: application/json`).
All timestamps are transmitted as UTC ISO-8601 strings (e.g. `2026-10-13T09:00:00Z`).

---

## Enums

### `LeadStatus`
- `new`
- `contacted`
- `qualified`
- `proposal_sent`
- `won`
- `lost`

### `DiscussionKind`
- `note`
- `system`

---

## Standard Error Envelope

All error responses (`400`, `404`, `422`, `500`) return this exact JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary of the error.",
    "details": [
      {
        "field": "follow_up_at",
        "message": "Follow-up date cannot be in the past."
      }
    ]
  }
}
```

- `code`: Machine-readable string (`NOT_FOUND`, `VALIDATION_ERROR`, `BAD_REQUEST`, `INTERNAL_ERROR`).
- `message`: Top-level human-readable message.
- `details`: Optional list of field-level validation issues (included on `422`, empty list `[]` otherwise).

---

## Endpoints

### 1. Health Check
`GET /api/v1/health`

**Response `200 OK`:**
```json
{
  "status": "ok"
}
```

---

### 2. List Leads
`GET /api/v1/leads`

Returns all leads ordered by `last_discussion_at DESC, id DESC`. Computes `last_note` and `last_discussion_at` via correlated scalar subqueries (no N+1).

**Query Parameters:**
- `status` (optional, `LeadStatus`): Filter by exact status.
- `q` (optional, `string`): Case-insensitive substring match on `name` (or `company`).

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Sarah Connor",
      "company": "Acme Corp",
      "phone": "555-0199",
      "status": "proposal_sent",
      "follow_up_at": "2026-10-13T14:00:00Z",
      "created_at": "2026-10-07T10:30:00Z",
      "last_note": "Sent pricing tier PDF. Said she would review with her boss.",
      "last_discussion_at": "2026-10-11T10:30:00Z"
    }
  ]
}
```

---

### 3. Create Lead
`POST /api/v1/leads`

Creates a new lead with status `new` and atomically inserts an initial `system` discussion (`"Lead created."`) in the same transaction.

**Request Body:**
```json
{
  "name": "Hank Scorpio",
  "company": "Globex",
  "phone": "555-0123"
}
```
- `name`: required, trimmed, 1–120 characters after trimming.
- `company`: optional string, trimmed; empty string normalised to `null` (max 120 chars).
- `phone`: optional string, trimmed; empty string normalised to `null` (max 40 chars).

**Response `201 Created`:**
Returns the created `LeadSummary` (same shape as items in `GET /api/v1/leads`, including `last_note: "Lead created."` and `last_discussion_at`).

**Errors:**
- `422 Unprocessable Entity` if `name` is missing, blank after trimming, or exceeds 120 chars.

---

### 4. Get Lead Detail (with Timeline)
`GET /api/v1/leads/{lead_id}`

Returns the lead along with its full discussion history ordered newest first (`created_at DESC, id DESC`).

**Response `200 OK`:**
```json
{
  "id": 1,
  "name": "Sarah Connor",
  "company": "Acme Corp",
  "phone": "555-0199",
  "status": "proposal_sent",
  "follow_up_at": "2026-10-13T14:00:00Z",
  "created_at": "2026-10-07T10:30:00Z",
  "last_note": "Sent pricing tier PDF. Said she would review with her boss.",
  "last_discussion_at": "2026-10-11T10:30:00Z",
  "discussions": [
    {
      "id": 3,
      "lead_id": 1,
      "note": "Sent pricing tier PDF. Said she would review with her boss.",
      "follow_up_at": "2026-10-13T14:00:00Z",
      "kind": "note",
      "created_at": "2026-10-11T10:30:00Z"
    },
    {
      "id": 1,
      "lead_id": 1,
      "note": "Lead created.",
      "follow_up_at": null,
      "kind": "system",
      "created_at": "2026-10-07T10:30:00Z"
    }
  ]
}
```

**Errors:**
- `404 Not Found` if `lead_id` does not exist.

---

### 5. Update Lead Status
`PATCH /api/v1/leads/{lead_id}/status`

Updates the lead's status.

**Request Body:**
```json
{
  "status": "qualified"
}
```

**Response `200 OK`:**
Returns the updated `LeadSummary`.

**Errors:**
- `404 Not Found` if `lead_id` does not exist.
- `422 Unprocessable Entity` if `status` is not a valid `LeadStatus`.

---

### 6. Add Discussion Note
`POST /api/v1/leads/{lead_id}/discussions`

Adds a `note` discussion to the lead. If `follow_up_at` is provided (non-null), updates `lead.follow_up_at` to that timestamp in the same transaction. If `follow_up_at` is omitted or `null`, `lead.follow_up_at` is left unchanged.

**Request Body:**
```json
{
  "note": "Spoke with procurement. Need revised quote by Friday.",
  "follow_up_at": "2026-10-16T14:00:00Z"
}
```
- `note`: required, trimmed, 1–2000 characters after trimming.
- `follow_up_at`: optional timezone-aware ISO-8601 datetime. Must not be in the past (5-minute grace window allowed for clock skew: `follow_up_at >= now - 5 minutes`).

**Response `201 Created`:**
```json
{
  "discussion": {
    "id": 10,
    "lead_id": 1,
    "note": "Spoke with procurement. Need revised quote by Friday.",
    "follow_up_at": "2026-10-16T14:00:00Z",
    "kind": "note",
    "created_at": "2026-10-13T09:15:00Z"
  },
  "lead": {
    "id": 1,
    "name": "Sarah Connor",
    "company": "Acme Corp",
    "phone": "555-0199",
    "status": "proposal_sent",
    "follow_up_at": "2026-10-16T14:00:00Z",
    "created_at": "2026-10-07T10:30:00Z",
    "last_note": "Spoke with procurement. Need revised quote by Friday.",
    "last_discussion_at": "2026-10-13T09:15:00Z"
  }
}
```

**Errors:**
- `404 Not Found` if `lead_id` does not exist.
- `422 Unprocessable Entity` if `note` is blank/too long, or `follow_up_at` is naive or in the past.

---

### 7. Clear Follow-up ("Mark Done")
`DELETE /api/v1/leads/{lead_id}/follow-up`

Clears `lead.follow_up_at` (sets it to `null`). Historical `discussion.follow_up_at` values on past discussions remain intact.

**Response `200 OK`:**
Returns the updated `LeadSummary` (with `follow_up_at: null`).

**Errors:**
- `404 Not Found` if `lead_id` does not exist.
