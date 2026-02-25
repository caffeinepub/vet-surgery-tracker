# Specification

## Summary
**Goal:** Restore the "New Case" button and full case creation form functionality in SurgiPaw as it existed in version 77.

**Planned changes:**
- Restore the "New Case" button in `CasesListView.tsx` with its original visual appearance, placement, and click handler that opens `CaseFormDialog`
- Restore `CaseFormDialog.tsx` with all form fields (MRN, dates, patient info, species, sex, notes), form validation, speech-to-text quick-fill, AI-assisted structured text parsing, previous-case lookup, checklist task selection, and case submission via the create case mutation

**User-visible outcome:** Users can click the "New Case" button in the cases list, fill out the full case creation form, and submit it to create a new surgery case that immediately appears in the list.
