# Specification

## Summary
**Goal:** Add sorting functionality to case cards by arrival date and open task count.

**Planned changes:**
- Add a sorting control UI (dropdown or button group) above the case cards grid with options for sorting by arrival date (newest/oldest first) and open tasks (most/fewest first)
- Implement sorting logic that reorders case cards based on the selected option using arrivalDate and uncompleted checklist item counts
- Ensure sorting persists and updates correctly when users search, create/update cases, or toggle checklist items

**User-visible outcome:** Users can sort case cards by arrival date (newest or oldest first) or by number of open tasks (most or fewest first), with the sort order persisting across other actions like searching and updating cases.
