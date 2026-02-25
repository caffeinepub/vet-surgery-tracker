# Specification

## Summary
**Goal:** Create a reusable Veterinary Workflow Icons component system and integrate it into the Dashboard and Cases pages, replacing existing task/checklist icons with colored, type-specific SVG icons.

**Planned changes:**
- Create `workflowTokens.ts` exporting 8 workflow color hex values (`discharge`, `notified`, `labs`, `histo`, `imaging`, `surgery`, `culture`, `followup`), `iconSize`, and `strokeWidth` constants
- Create `WorkflowIconBase.tsx` as a base SVG wrapper accepting `color` and `children` props
- Create 8 individual icon components (`IconDischarge`, `IconNotified`, `IconLabs`, `IconHisto`, `IconImaging`, `IconSurgery`, `IconCulture`, `IconFollowUp`), each using the correct color token and SVG path data
- Create `WorkflowIcon.tsx` dispatcher component accepting a `WorkflowType` union prop and rendering the matching icon
- Replace existing task/checklist icons in `DashboardView.tsx` with `WorkflowIcon` components mapped to their workflow types
- Replace existing task/checklist icons in `CaseCard.tsx` and `ChecklistEditor.tsx` with `WorkflowIcon` components, preserving all existing toggle/completion functionality

**User-visible outcome:** Task and checklist items throughout the Dashboard and Cases pages display distinct, colored SVG icons for each workflow type (discharge, labs, imaging, surgery, etc.) instead of the previous generic icons or text indicators.
