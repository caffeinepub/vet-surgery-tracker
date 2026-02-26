# Specification

## Summary
**Goal:** Add a "Follow Up" task type with an aqua circular arrow icon to the Dashboard and Cases pages in SurgiPaw.

**Planned changes:**
- Add a "Follow Up" task variant to the backend task type definitions
- Add a "Follow Up" checklist item with an aqua color token to the frontend checklist definitions, included in default selections and task counting logic
- Assign an aqua color (e.g. `#00BFBF`) to the "Follow Up" task type in `workflowTokens.ts` and apply it to the existing `IconFollowUp.tsx` circular arrow icon
- Map the "Follow Up" task type string to `IconFollowUp` in the `WorkflowIcon` dispatcher so the aqua circular arrow renders on case cards in both DashboardView and CasesListView

**User-visible outcome:** A "Follow Up" checklist task with an aqua circular arrow icon appears on both the Dashboard and Cases pages, participates in open-task counts, and is included by default on new cases.
