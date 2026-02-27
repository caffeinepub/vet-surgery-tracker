# Specification

## Summary
**Goal:** Add a Daily Summary task, a dashboard view toggle, update three workflow icons, and remove Surgery Report as a default task selection in SurgiPaw.

**Planned changes:**
- Remove "Surgery Report" from default pre-checked tasks in CaseFormDialog (it remains selectable but unchecked by default)
- Add a new "Daily Summary" task type to the checklist system (unchecked by default), visible on both the Dashboard and Cases list pages, with a tear-off calendar page SVG icon (IconDailySummary component)
- Update backend Task type to include a `dailySummary` variant and update CSV import/export schema accordingly
- Add a toggle button to the Dashboard page header to switch between the Weekly Calendar view and the Card Grid view (defaults to Weekly Calendar, state kept in component)
- Replace the Histology (histo) workflow icon with a microscope SVG in IconHisto.tsx
- Replace the Surgery Report workflow icon with a scalpel SVG in IconSurgery.tsx
- Replace the Culture workflow icon with a petri dish SVG in IconCulture.tsx

**User-visible outcome:** Users can now toggle between calendar and grid views on the Dashboard, see a new Daily Summary task on case cards in both views, find Surgery Report unchecked by default when creating a case, and see updated microscope, scalpel, and petri dish icons for Histology, Surgery Report, and Culture tasks respectively.
