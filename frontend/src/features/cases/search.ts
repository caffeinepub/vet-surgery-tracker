import type { SurgeryCase } from '../../backend';
import { CHECKLIST_ITEMS } from './checklist';

export function searchCases(cases: SurgeryCase[], query: string): SurgeryCase[] {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return cases;
  }

  return cases.filter((surgeryCase) => {
    if (
      surgeryCase.medicalRecordNumber.toLowerCase().includes(lowerQuery) ||
      surgeryCase.petName.toLowerCase().includes(lowerQuery) ||
      surgeryCase.ownerLastName.toLowerCase().includes(lowerQuery) ||
      surgeryCase.species.toLowerCase().includes(lowerQuery) ||
      surgeryCase.breed.toLowerCase().includes(lowerQuery) ||
      surgeryCase.sex.toLowerCase().includes(lowerQuery) ||
      surgeryCase.presentingComplaint.toLowerCase().includes(lowerQuery) ||
      surgeryCase.notes.toLowerCase().includes(lowerQuery)
    ) {
      return true;
    }

    for (const item of CHECKLIST_ITEMS) {
      if (item.label.toLowerCase().includes(lowerQuery)) {
        const isSelected = surgeryCase.task[item.selectedField];
        const isCompleted = surgeryCase.task[item.completedField];
        if (isSelected && !isCompleted) {
          return true;
        }
      }
    }

    return false;
  });
}
