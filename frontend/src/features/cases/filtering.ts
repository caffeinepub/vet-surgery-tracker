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
    // A case is "all tasks completed" only if it has at least one selected task
    // and all selected tasks are completed
    let hasAnySelectedTask = false;

    for (const item of CHECKLIST_ITEMS) {
      const isSelected = surgeryCase.task[item.selectedField];
      const isCompleted = surgeryCase.task[item.completedField];

      if (isSelected) {
        hasAnySelectedTask = true;
        // If a task is selected but not completed, exclude this case
        if (!isCompleted) {
          return false;
        }
      }
    }

    // Include only if there was at least one selected task and all were completed
    return hasAnySelectedTask;
  });
}

export function filterOutCompletedCases(cases: SurgeryCase[]): SurgeryCase[] {
  return cases.filter((surgeryCase) => {
    let hasAnySelectedTask = false;

    for (const item of CHECKLIST_ITEMS) {
      const isSelected = surgeryCase.task[item.selectedField];
      const isCompleted = surgeryCase.task[item.completedField];

      if (isSelected) {
        hasAnySelectedTask = true;
        // If a task is selected but not completed, include this case
        if (!isCompleted) {
          return true;
        }
      }
    }

    // If no tasks are selected at all, include the case (it's not "completed")
    if (!hasAnySelectedTask) {
      return true;
    }

    // All selected tasks are completed — exclude this case
    return false;
  });
}
