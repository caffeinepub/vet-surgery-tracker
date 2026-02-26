# Specification

## Summary
**Goal:** Fix a regression where surgery cases no longer display on the Dashboard and Cases list pages (introduced between v93 and v95).

**Planned changes:**
- Repair broken React Query hook result wiring on the Dashboard page so fetched cases render correctly
- Repair broken prop passing, query result destructuring, or data mapping on the Cases list page (CasesListView)
- Inspect and fix any issues introduced by the UI refactor involving WorkflowIcon.tsx, CaseCard.tsx, ChecklistEditor.tsx, and useQueries.ts
- Ensure CaseCard components render correctly with case data including workflow task icons
- Ensure ChecklistEditor receives and renders the correct task data per case

**User-visible outcome:** Surgery cases fetched from the backend canister display correctly on both the Dashboard and Cases list pages, with no blank lists or console errors.
