import type { SurgeryCase, Species, Checklist } from '../../backend';
import { searchCases } from './search';
import { sortCases, type SortOption } from './sorting';

export function filterCasesBySpecies(
  cases: SurgeryCase[],
  selectedSpecies: Set<Species>
): SurgeryCase[] {
  if (selectedSpecies.size === 0) {
    return cases;
  }
  return cases.filter((surgeryCase) => selectedSpecies.has(surgeryCase.species));
}

export function filterCasesByTaskTypes(
  cases: SurgeryCase[],
  selectedTaskTypes: Set<keyof Checklist>
): SurgeryCase[] {
  if (selectedTaskTypes.size === 0) {
    return cases;
  }

  return cases.filter((surgeryCase) => {
    const checklist = surgeryCase.checklist;
    
    // Show cases where at least one of the selected task types is NOT complete (false)
    for (const taskKey of selectedTaskTypes) {
      if (!checklist[taskKey]) {
        return true;
      }
    }
    return false;
  });
}

export function applyAllFilters(
  cases: SurgeryCase[],
  searchQuery: string,
  selectedSpecies: Set<Species>,
  selectedTaskTypes: Set<keyof Checklist>,
  sortOption: SortOption
): SurgeryCase[] {
  // Apply filters in sequence
  let filtered = searchCases(cases, searchQuery);
  filtered = filterCasesBySpecies(filtered, selectedSpecies);
  filtered = filterCasesByTaskTypes(filtered, selectedTaskTypes);
  
  // Apply sorting
  return sortCases(filtered, sortOption);
}
