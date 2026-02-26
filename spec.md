# Specification

## Summary
**Goal:** Revert the frontend data-fetching logic for surgery cases back to the Version 93 implementation to fix a regression introduced in Version 97 that caused cases to not appear.

**Planned changes:**
- Revert data-fetching hooks/queries in `DashboardView.tsx` to the Version 93 approach
- Revert data-fetching hooks/queries in `CasesListView.tsx` to the Version 93 approach

**User-visible outcome:** Surgery cases load and display correctly on both the Dashboard and Cases list views after login.
