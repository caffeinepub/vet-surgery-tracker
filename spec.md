# Specification

## Summary
**Goal:** Diagnose and fix the blank page / database fetch failure in the SurgiPaw app so that the Dashboard and Cases pages correctly load and display data from the canister.

**Planned changes:**
- Audit and fix the backend Motoko actor (`backend/main.mo`) to ensure all public query and update methods compile correctly, return valid data, and have no runtime errors or broken async flows.
- Audit and fix `frontend/src/hooks/useQueries.ts` to ensure all React Query hooks correctly call canister methods, handle async properly, and do not silently fail.
- Fix the actor instantiation in `frontend/src/hooks/useActor.ts` to return a valid actor instance for both authenticated and anonymous sessions.
- Audit and fix `frontend/src/features/dashboard/components/DashboardView.tsx` and `frontend/src/features/cases/components/CasesListView.tsx` to properly consume React Query hooks, show loading indicators, and display meaningful error messages instead of a blank page when fetches fail.
- Audit and fix `frontend/src/App.tsx` for authentication-gating race conditions or missing guard clauses that cause a blank page for returning authenticated users, and ensure the profile setup modal only blocks the UI when genuinely required.

**User-visible outcome:** The Dashboard and Cases pages no longer show a blank screen — they display a loading indicator while fetching, render case data when available, and show a descriptive error message if a fetch fails.
