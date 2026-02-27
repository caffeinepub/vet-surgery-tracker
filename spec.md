# Specification

## Summary
**Goal:** Add a Daily Summary task, uncheck Follow Up by default, display an X overlay on completed task icons, and keep completed cases visible but shaded on the Dashboard.

**Planned changes:**
- Change the Follow Up task default state to unchecked in the checklist configuration so new cases are created without it selected.
- Completed cases remain visible on the Dashboard (calendar and grid/list views) with a shaded/muted appearance instead of being removed or hidden.
- When a task is marked complete, render an X overlay (two crossing lines) directly on top of the task's icon in CaseCard, CalendarCaseCard, and ChecklistEditor.
- Add a new "Daily Summary" task to the checklist configuration (defaulting to unchecked) with a tear-off calendar page icon showing two digits; it appears in CaseFormDialog, CaseEditDialog, ChecklistEditor, CaseCard, and CalendarCaseCard, and the X overlay applies when it is marked complete.
- Update the backend Task type to include `dailySummary` as a valid task key.

**User-visible outcome:** Users creating new cases will find Follow Up unchecked and a new Daily Summary task available (also unchecked by default). Completed task icons show an X overlay on the icon graphic, and fully completed cases stay visible on the Dashboard in a visually shaded state.
