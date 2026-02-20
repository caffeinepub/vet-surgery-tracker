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
