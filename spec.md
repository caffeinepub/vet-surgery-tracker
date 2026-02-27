# Specification

## Summary
**Goal:** Update two workflow icons (histo and labs) with new SVG illustrations and make calendar case cards navigate to the Cases page.

**Planned changes:**
- Replace the `IconHisto` SVG with a side-profile (lateral view) microscope illustration showing eyepiece, arm, stage, and base, using the existing `histo` color token.
- Replace the `IconLabs` SVG with a test tube illustration (elongated cylinder, closed bottom), using the existing `labs` color token.
- Make each `CalendarCaseCard` clickable so that clicking the card body navigates to the Cases page with the corresponding case highlighted/focused.
- Individual workflow icon toggles within `CalendarCaseCard` continue to function as task toggles without triggering navigation.
- Add a pointer cursor and hover state to `CalendarCaseCard` to indicate it is clickable.

**User-visible outcome:** The histo and labs icons in case cards now display a side-view microscope and a test tube respectively. Clicking a case card in the weekly calendar view navigates the user to the Cases page and highlights the relevant case.
