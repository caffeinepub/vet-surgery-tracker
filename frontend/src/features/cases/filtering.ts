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
    for (const taskKey of selectedTaskKeys) {
      const item = CHECKLIST_ITEMS.find((i) => i.key === taskKey);
      if (!item) continue;

      const isSelected = surgeryCase.task[item.selectedField];
      const isCompleted = surgeryCase.task[item.completedField];

      if (isSelected && !isCompleted) {
        return true;
      }
    }
    return false;
  });
}

export function filterCasesByAllTasksCompleted(cases: SurgeryCase[]): SurgeryCase[] {
  return cases.filter((surgeryCase) => {
    let hasAnySelectedTask = false;

    for (const item of CHECKLIST_ITEMS) {
      const isSelected = surgeryCase.task[item.selectedField];
      const isCompleted = surgeryCase.task[item.completedField];

      if (isSelected) {
        hasAnySelectedTask = true;
        if (!isCompleted) {
          return false;
        }
      }
    }

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
        if (!isCompleted) {
          return true;
        }
      }
    }

    if (!hasAnySelectedTask) {
      return true;
    }

    return false;
  });
}
