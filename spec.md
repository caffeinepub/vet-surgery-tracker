# Specification

## Summary
**Goal:** Add a weekly calendar view to the SurgiPaw Dashboard with a toggle to switch between the new calendar view and the existing card grid view.

**Planned changes:**
- Add a weekly calendar view to the DashboardView component displaying surgery cases in a 7-column grid (Sunday–Saturday) based on each case's Arrival Date
- Default the calendar to the current week on load, with Previous/Next navigation arrows to shift the displayed week by 7 days; show the current week's date range in the header
- Add a toggle button on the Dashboard to switch between the weekly calendar view (default) and the existing card grid view
- Each calendar case card displays: Pet Name, MRN, Species badge, Presenting Complaint, and task status icons; fully completed cases are visually shaded out (reduced opacity or muted background)
- Day columns with no cases show a subtle "No cases" placeholder instead of being blank

**User-visible outcome:** Users land on the Dashboard in weekly calendar view, can navigate between weeks, and can toggle back to the existing card grid view at any time.
