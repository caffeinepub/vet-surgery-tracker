# Specification

## Summary
**Goal:** Enhance the SurgiPaw dashboard with presenting complaint visibility, color-coded task icons, and a PDF export for cases with outstanding tasks.

**Planned changes:**
- Display the presenting complaint field on each case card/entry on the Dashboard without requiring expansion; show a graceful placeholder if absent
- Replace open dot indicators for checklist tasks with meaningful icons from lucide-react, color-coded by task type: Green (#22c55e) for Discharge Notes, Yellow (#eab308) for pDVM Notified, Orange (#f97316) for Labs, Purple (#a855f7) for Histo, Blue (#3b82f6) for Imaging, Red (#ef4444) for Surgery Report, Pink (#ec4899) for Culture
- Apply the same icon+color system consistently across Dashboard, Cases list, CaseCard, and ChecklistEditor components
- Update CHECKLIST_ITEMS in checklist.ts with the correct icon and color per task type
- Visually distinguish completed tasks from incomplete ones (e.g., dimmed or checkmark overlay)
- Add a Download/Export PDF button on the Dashboard or Cases page that generates a landscape table-formatted PDF of all cases with at least one incomplete task, including columns for MRN, patient name, presenting complaint, species, sex, age, arrival date, surgery date, attending clinician, and outstanding tasks

**User-visible outcome:** Users can see the presenting complaint on dashboard case cards at a glance, identify task status via distinct color-coded icons, and download a landscape PDF report listing all cases with their outstanding tasks.
