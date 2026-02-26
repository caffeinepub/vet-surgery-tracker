# Specification

## Summary
**Goal:** Diagnose and fix the frontend data-fetching failure that prevents surgery cases from loading in SurgiPaw after login.

**Planned changes:**
- Audit `backend/main.mo` to verify case-fetching query functions are correctly defined, exported, and use stable variable declarations so data survives upgrades
- Audit and fix `frontend/src/hooks/useActor.ts` to ensure the backend actor is properly initialized with the authenticated identity and refreshed when the identity changes
- Audit and fix `frontend/src/hooks/useQueries.ts` to ensure React Query hooks use correct backend method names, only run when a valid actor is available, and surface errors visibly
- Audit and fix `frontend/src/features/dashboard/components/DashboardView.tsx` and `frontend/src/features/cases/components/CasesListView.tsx` to correctly consume query hooks, handle loading/error states, and render case data

**User-visible outcome:** After logging in, surgery cases load and display correctly on both the Dashboard and Cases List views, with loading indicators while fetching and error messages if the fetch fails.
