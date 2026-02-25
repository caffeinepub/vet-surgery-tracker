# Specification

## Summary
**Goal:** Fix two regressions introduced in Version 78: cases not displaying in the Cases view, and the broken app logo in the navigation header.

**Planned changes:**
- Audit and fix the CasesListView, filtering, search, and query hooks changed in Version 78 so that existing cases are correctly loaded and displayed (reverting or correcting any logic that causes "No cases found" when cases exist).
- Fix the broken app logo in the top-left navigation header by correcting the image path or asset reference in App.tsx so the logo renders properly.

**User-visible outcome:** Existing cases are visible in the Cases list view, and the app logo displays correctly in the navigation header across all views.
