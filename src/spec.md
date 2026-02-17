# Specification

## Summary
**Goal:** Build a veterinary surgery case tracker with persistent case records, card-based browsing, full-field search, per-case to-do checklist, and CSV import/export.

**Planned changes:**
- Implement a persistent case data model in a single Motoko actor with CRUD methods (create, get by id, list, update, delete) and stable unique case identifiers.
- Build case create/edit UI with the exact specified fields and constrained option sets for Species and Sex, with Arrival Date defaulting to today.
- Add date inputs (Arrival Date, Date of Birth) that support both manual typing and a calendar/date-picker, with clear English validation errors for invalid dates.
- Add a per-case to-do checklist with exactly seven items and specified default checked states; persist checklist state with each case.
- Create a main list view that displays cases as cards and shows remaining (unchecked) to-do items on each card, including an English “no remaining items” indication when complete.
- Implement a search UI that filters case cards by matching across all case fields (including dates) and to-do item labels/states, updating without page reload.
- Add CSV export of cases and CSV import via file picker using a React CSV parser, including mapping for all case fields and checklist items, row-level validation/errors in English, and a deterministic create/update rule based on (Medical Record # + Arrival Date) or an in-UI documented rule.
- Apply a consistent blue color scheme and cohesive visual theme across the UI, keeping all user-facing text in English.

**User-visible outcome:** Users can create, edit, delete, and browse veterinary surgery cases as searchable cards with per-case to-do tracking, and import/export their cases via CSV with validation feedback.
