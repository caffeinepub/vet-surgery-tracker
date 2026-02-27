# Specification

## Summary
**Goal:** Fix the blank page issue in both Draft and Live app by diagnosing the data-fetching failure and reverting frontend data-fetching logic to the Version 107 implementation.

**Planned changes:**
- Audit the backend `main.mo` actor to ensure all query and update methods (e.g., `getCases`, `getDashboardData`) are publicly exposed, correctly typed, and free of runtime traps or missing stable variable declarations.
- Revert `frontend/src/hooks/useQueries.ts` (and any related hooks or utilities changed after Version 107) to exactly match the Version 107 data-fetching implementation, including query keys, actor invocation patterns, enabled conditions, and error handling.
- Audit the actor wiring between `useActor.ts` and `useQueries.ts` to ensure the actor instance, canister ID, and IDL are correctly aligned with the deployed backend, fixing any mismatches introduced after Version 107.

**User-visible outcome:** The Dashboard and Cases list views load and display surgery cases without a blank page; React Query fetches complete successfully after login.
