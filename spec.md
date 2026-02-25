# Specification

## Summary
**Goal:** Fix a regression introduced between Version 87 and Version 91 that causes surgery cases to not appear in the live app, by restoring correct backend canister query logic and frontend React Query hook behavior.

**Planned changes:**
- Audit and restore the backend canister query function(s) responsible for fetching surgery cases, fixing any regressions in query logic, access control (role-based authorization), data filters, or return types that silently exclude cases for authenticated users.
- Audit and restore `frontend/src/hooks/useQueries.ts` React Query hooks, fixing any regressions in query key structure, actor call method names, response transformation, or error handling that cause cases to fail to load.
- Ensure an empty-state message is displayed if the canister genuinely returns no cases, rather than silently failing.
- Generate `migration.mo` if backend stable storage is affected, to preserve existing case records.

**User-visible outcome:** Authenticated users can see their existing surgery cases in the CasesListView and DashboardView in the live app without console errors or empty screens.
