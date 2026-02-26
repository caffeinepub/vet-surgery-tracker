# Specification

## Summary
**Goal:** Fix the Version 94 frontend regression that causes a blank Cases list on both the Dashboard and Cases pages.

**Planned changes:**
- Investigate the Version 94 changes to workflow/task icons and their associated logic to identify what broke Cases loading
- Compare and fix the affected files (`useQueries.ts`, `CasesListView.tsx`, `DashboardView.tsx`, `CaseCard.tsx`, `ChecklistEditor.tsx`, `WorkflowIcon.tsx`) to restore cases data fetching and rendering to the working Version 93 state
- Preserve any valid workflow/task icon improvements from Version 94 that do not cause the regression

**User-visible outcome:** Cases are displayed again on both the Dashboard and Cases pages, with workflow/task icons still rendering correctly and no console errors.
