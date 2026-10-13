# Open Questions & Environment Notes

1. **Follow-ups on Won / Lost leads**: Per `docs/PRODUCT_SPEC.md` (AC-2) and `ARCHITECTURE.md` (Rule 5), leads with status `won` or `lost` are excluded from the pinned "Today's Follow-ups" section even if they still have a `follow_up_at` timestamp set.
2. **Search scope**: `GET /api/v1/leads?q=` searches both lead `name` and `company` case-insensitively so sales reps can quickly find leads by either person or organization name.
