# Specification

## Summary
**Goal:** Fix the arrival date default in the new case form, add "Daily Summary" as a task option in case forms and edit dialogs, and make patient cards fully expanded by default with no collapse toggle.

**Planned changes:**
- Pre-populate the Arrival Date field in CaseFormDialog with today's date (remains manually editable)
- Add "Daily Summary" as a selectable checklist option in both CaseFormDialog and CaseEditDialog, with a corresponding workflow icon (IconDailySummary) displayed on patient cards when assigned
- Update the CHECKLIST_ITEMS configuration to include a `dailySummary` entry
- Remove the collapse/expand toggle from CaseCard so all patient information is visible by default
- Apply a rounded rectangle visual style (rounded corners, border or shadow) to CaseCard

**User-visible outcome:** When creating a case, today's date is pre-filled in the Arrival Date field. Users can assign a "Daily Summary" task to any case and see its icon on the patient card. All patient cards display fully expanded with all details visible immediately, with no ability to collapse them.
