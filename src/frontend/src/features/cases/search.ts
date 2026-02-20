import type { SurgeryCase } from '../../backend';
import { formatDate } from './validation';
import { CHECKLIST_ITEMS } from './checklist';
import { SPECIES_OPTIONS, SEX_OPTIONS } from './types';

export function searchCases(cases: SurgeryCase[], query: string): SurgeryCase[] {
  if (!query.trim()) {
    return cases;
  }

  const lowerQuery = query.toLowerCase().trim();

  return cases.filter((surgeryCase) => {
    // Search in text fields
    if (surgeryCase.medicalRecordNumber.toLowerCase().includes(lowerQuery)) return true;
    if (surgeryCase.petName.toLowerCase().includes(lowerQuery)) return true;
    if (surgeryCase.ownerLastName.toLowerCase().includes(lowerQuery)) return true;
    if (surgeryCase.breed.toLowerCase().includes(lowerQuery)) return true;
    if (surgeryCase.presentingComplaint.toLowerCase().includes(lowerQuery)) return true;
    if (surgeryCase.notes.toLowerCase().includes(lowerQuery)) return true;

    // Search in species
    const speciesLabel = SPECIES_OPTIONS.find((opt) => opt.value === surgeryCase.species)?.label || '';
    if (speciesLabel.toLowerCase().includes(lowerQuery)) return true;

    // Search in sex
    const sexLabel = SEX_OPTIONS.find((opt) => opt.value === surgeryCase.sex)?.label || '';
    if (sexLabel.toLowerCase().includes(lowerQuery)) return true;

    // Search in dates
    if (formatDate(surgeryCase.arrivalDate).toLowerCase().includes(lowerQuery)) return true;
    if (surgeryCase.dateOfBirth && formatDate(surgeryCase.dateOfBirth).toLowerCase().includes(lowerQuery)) return true;

    // Search in checklist items
    for (const item of CHECKLIST_ITEMS) {
      if (item.label.toLowerCase().includes(lowerQuery)) {
        // If searching for a checklist item name, show cases where it's incomplete (false)
        if (surgeryCase.completedTasks[item.key] === false) return true;
      }
    }

    return false;
  });
}
