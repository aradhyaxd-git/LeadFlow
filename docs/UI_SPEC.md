# UI Specification

## Design Direction
Clean, high-contrast SaaS workspace inspired by Linear and Attio. All flows live on a single screen with modal dialogs for Lead Timeline and Add New Lead.

## Typography & Fonts
- Primary font: `Inter` via `next/font/google`
- Monospace numbers (`tabular-nums`) for timestamps and badge counts

## Color Tokens & Contrast (WCAG AA >= 4.5:1 verified)

### Surface & Text
- Background canvas: `#F8FAFC` (`slate-50`)
- Card surface: `#FFFFFF` with `#E2E8F0` (`slate-200`) border
- Primary text: `#0F172A` (`slate-900`)
- Secondary text: `#475569` (`slate-600`)
- Muted text: `#64748B` (`slate-500`)
- Primary accent: `#2563EB` (`blue-600`), hover `#1D4ED8` (`blue-700`), text `#FFFFFF`

### Status Badge Pairs (Background / Text / Border)
Every badge pair achieves > 4.5:1 contrast ratio:
- `new`: bg `#DCFCE7` (`green-100`), text `#166534` (`green-800`), border `#BBF7D0`
- `contacted`: bg `#FEF9C3` (`yellow-100`), text `#854D0E` (`yellow-800`), border `#FEF08A`
- `qualified`: bg `#E0E7FF` (`indigo-100`), text `#3730A3` (`indigo-800`), border `#C7D2FE`
- `proposal_sent`: bg `#F3E8FF` (`purple-100`), text `#6B21A8` (`purple-800`), border `#E9D5FF`
- `won`: bg `#F1F5F9` (`slate-100`), text `#334155` (`slate-700`), border `#CBD5E1`
- `lost`: bg `#F1F5F9` (`slate-100`), text `#475569` (`slate-600`), border `#E2E8F0`

### Follow-up Banner & Callout Tokens
- **Due Today**:
  - Card container: `#EFF6FF` (`blue-50/70`) with `#BFDBFE` (`blue-200`) border
  - Chip: bg `#DBEAFE` (`blue-100`), text `#1E40AF` (`blue-800`) — `"🔔 Follow-up today at 2:00 PM"`
- **Overdue**:
  - Card container: `#FEF2F2` (`red-50/70`) with `#FECACA` (`red-200`) border
  - Chip: bg `#FEE2E2` (`red-100`), text `#991B1B` (`red-800`) — `"⚠️ Overdue · Was due Oct 11, 2:00 PM (2 days ago)"`

## Layout & Components

### 1. Header
- App brand (`LeadFlow` with subtle trend icon) on the left
- Primary CTA button `+ Add New Lead` on the right

### 2. Filter Bar & Search
- Status filter chips (`All`, `New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`) with live lead counts per status
- Active chip uses dark fill (`#0F172A` text `#FFFFFF`)
- Search input with `Cmd/Ctrl + K` keyboard shortcut hint and clear button
- State synced with URL query parameters (`?status=...&q=...`)

### 3. Pinned Section ("📌 TODAY'S FOLLOW-UPS")
- Rendered above "ALL LEADS" only when >= 1 lead has a follow-up that is today or overdue (in browser local timezone) AND status is not `won` or `lost`
- Sorted with overdue leads first (oldest follow-up first), then today's follow-ups (earliest first)
- Leads shown here are excluded from the "ALL LEADS" section below so no lead appears twice

### 4. All Leads List ("ALL LEADS")
- Each `LeadCard` is an interactive button/row (`role="button"`, `tabIndex={0}`) showing:
  - Lead name (bold) and company in parentheses
  - Status badge on the top right
  - `Last Note:` snippet (1 line truncated with ellipsis) + relative time (`2 hours ago`)
  - Future follow-up badge (if scheduled for a future day) in subtle slate/blue
- `won` and `lost` cards render slightly muted (`opacity-75` hover `opacity-100`)

### 5. Lead Timeline Dialog (`LeadDialog`)
- Built with `@radix-ui/react-dialog` for focus trapping, `Esc` dismissal, and return of focus to the trigger row
- Responsive: centered modal (`max-w-xl`) on desktop; bottom-sheet (`rounded-t-2xl`) on mobile (`< 640px`)
- **Dialog Header**:
  - Lead Name, Company, Phone (with phone icon if present)
  - Status selector (`<select>` or accessible menu) that persists immediately on change
  - Current follow-up banner with `"Mark done"` button if `follow_up_at` is set
- **Timeline**:
  - Reverse chronological order (newest at top)
  - Vertical timeline line with blue dot on the latest entry and slate dots on older entries
  - Shows formatted local date/time + relative time (`May 4, 10:30 AM · 2 days ago`)
  - System notes (`kind === "system"`) rendered in italic muted text
  - Notes that scheduled a follow-up display a `"📅 Follow-up set for: ..."` badge
- **Note Form (Sticky footer inside dialog)**:
  - Textarea (`Log a new discussion...`), supports `Cmd/Ctrl + Enter` to submit
  - `"Set Follow-up"` checkbox; when checked, reveals date input, time input, and quick-pick chips (`Tomorrow 10 AM`, `In 3 days`, `Next week`)
  - Inline validation for empty notes or past follow-up dates

### 6. Add New Lead Dialog (`AddLeadDialog`)
- Modal with fields:
  - `Full Name *` (required)
  - `Company` (optional)
  - `Phone` (optional)
- Inline validation on submit if Full Name is blank
- Cancel and `Save Lead` buttons
