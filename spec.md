# Specification

## Summary
**Goal:** Add a "Daily Summary" task to the New Case form and improve the Calendar view's readability and information density in SurgiPaw.

**Planned changes:**
- Add "Daily Summary" as a selectable task in the New Case form (CaseFormDialog), using the existing `IconDailySummary` icon, navy blue color, and defaulting to unchecked
- Register `dailySummary` in `CHECKLIST_ITEMS` (checklist.ts) with navy blue color token so it appears in CaseCard and CalendarCaseCard
- Set the navy blue color token for `dailySummary` in `workflowTokens.ts` to an appropriate navy blue value (e.g. `#1a3a6b`)
- Display the patient's last name on each CalendarCaseCard
- Increase the font size of all text in CalendarCaseCard for better readability
- Decrease the size of workflow task icons in CalendarCaseCard to reduce visual clutter

**User-visible outcome:** Users can log a Daily Summary task when creating a new case, see it on both the Cases list and Calendar views, and the Calendar cards now show the patient's last name with larger text and smaller icons.
