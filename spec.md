# Specification

## Summary
**Goal:** Fix surgery cases not loading on the Dashboard and Cases pages in SurgiPaw.

**Planned changes:**
- Inspect and fix the data-fetching logic in `frontend/src/hooks/useQueries.ts` so that surgery cases are correctly fetched and returned (fixing any regression in query keys, actor calls, or result transformation).
- Ensure `DashboardView.tsx` correctly consumes the cases query result, handling loading, error, and success states, and renders CaseCard components for each case.
- Ensure `CasesListView.tsx` correctly consumes the cases query result, handling loading, error, and success states, and renders CaseCard components for each case.
- Display appropriate loading indicators while cases are being fetched on both pages.
- Display user-friendly error messages if the fetch fails on either page.
- Ensure both pages show an appropriate empty state when no cases exist.

**User-visible outcome:** Surgery case cards appear correctly on both the Dashboard and Cases list pages when cases exist, with proper loading and error states shown as appropriate.
