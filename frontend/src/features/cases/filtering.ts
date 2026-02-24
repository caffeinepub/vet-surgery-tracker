import type { SurgeryCase, Species } from '../../backend';
import { CHECKLIST_ITEMS } from './checklist';

export function filterCasesBySpecies(cases: SurgeryCase[], selectedSpecies: Set<Species>): SurgeryCase[] {
  if (selectedSpecies.size === 0) {
    return cases;
  }
  return cases.filter((surgeryCase) => selectedSpecies.has(surgeryCase.species));
}

export function filterCasesByTaskTypes(cases: SurgeryCase[], selectedTaskKeys: Set<string>): SurgeryCase[] {
  if (selectedTaskKeys.size === 0) {
    return cases;
  }

  return cases.filter((surgeryCase) => {
    // Show case if at least one of the selected task types is incomplete
    for (const taskKey of selectedTaskKeys) {
      const item = CHECKLIST_ITEMS.find((i) => i.key === taskKey);
      if (!item) continue;

      const isSelected = surgeryCase.task[item.selectedField];
      const isCompleted = surgeryCase.task[item.completedField];

      // If this task is selected but not completed, include the case
      if (isSelected && !isCompleted) {
        return true;
      }
    }
    return false;
  });
}

export function filterCasesByAllTasksCompleted(cases: SurgeryCase[]): SurgeryCase[] {
  return cases.filter((surgeryCase) => {
    // Check if all selected tasks are completed
    for (const item of CHECKLIST_ITEMS) {
      const isSelected = surgeryCase.task[item.selectedField];
      const isCompleted = surgeryCase.task[item.completedField];

      // If a task is selected but not completed, exclude this case
      if (isSelected && !isCompleted) {
        return false;
      }
    }
    // All selected tasks are completed (or no tasks selected)
    return true;
  });
}

export function filterOutCompletedCases(cases: SurgeryCase[]): SurgeryCase[] {
  return cases.filter((surgeryCase) => {
    // Check if at least one selected task is not completed
    for (const item of CHECKLIST_ITEMS) {
      const isSelected = surgeryCase.task[item.selectedField];
      const isCompleted = surgeryCase.task[item.completedField];

      // If a task is selected but not completed, include this case
      if (isSelected && !isCompleted) {
        return true;
      }
    }
    // All selected tasks are completed, exclude this case
    return false;
  });
}
