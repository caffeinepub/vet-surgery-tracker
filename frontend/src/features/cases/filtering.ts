import type { SurgeryCase, Species } from '../../backend';
import { CHECKLIST_ITEMS, getRemainingChecklistItems } from './checklist';

/**
 * Filter cases by species.
 * If selectedSpecies is empty, returns all cases.
 */
export function filterBySpecies(cases: SurgeryCase[], selectedSpecies: Set<Species>): SurgeryCase[] {
  if (selectedSpecies.size === 0) return cases;
  return cases.filter((c) => selectedSpecies.has(c.species));
}

/**
 * Filter cases by task types (workflowType strings).
 * Returns cases that have at least one SELECTED task matching any of the selectedTaskTypes.
 * If selectedTaskTypes is empty, returns all cases.
 */
export function filterByTaskTypes(cases: SurgeryCase[], selectedTaskTypes: Set<string>): SurgeryCase[] {
  if (selectedTaskTypes.size === 0) return cases;

  return cases.filter((c) => {
    return CHECKLIST_ITEMS.some((item) => {
      if (!selectedTaskTypes.has(item.workflowType)) return false;
      return c.task[item.selectedField as keyof typeof c.task] === true;
    });
  });
}

/**
 * Filter out cases where all selected tasks are completed.
 * Returns only cases that have at least one remaining (selected but not completed) task,
 * or cases with no selected tasks at all.
 */
export function filterOutCompletedCases(cases: SurgeryCase[]): SurgeryCase[] {
  return cases.filter((c) => {
    const remaining = getRemainingChecklistItems(c.task);
    return remaining.length > 0;
  });
}

/**
 * Filter to only cases where ALL selected tasks are completed.
 */
export function filterAllTasksCompleted(cases: SurgeryCase[]): SurgeryCase[] {
  return cases.filter((c) => {
    const remaining = getRemainingChecklistItems(c.task);
    return remaining.length === 0;
  });
}
