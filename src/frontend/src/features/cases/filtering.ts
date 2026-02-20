import type { SurgeryCase, Species, CompletedTasks } from '../../backend';
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
  selectedTaskTypes: Set<keyof CompletedTasks>
): SurgeryCase[] {
  if (selectedTaskTypes.size === 0) {
    return cases;
  }

  return cases.filter((surgeryCase) => {
    const completedTasks = surgeryCase.completedTasks;
    
    // Show cases where at least one of the selected task types is NOT complete (false)
    for (const taskKey of selectedTaskTypes) {
      if (completedTasks[taskKey] === false) {
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
  selectedTaskTypes: Set<keyof CompletedTasks>,
  sortOption: SortOption
): SurgeryCase[] {
  // Apply filters in sequence
  let filtered = searchCases(cases, searchQuery);
  filtered = filterCasesBySpecies(filtered, selectedSpecies);
  filtered = filterCasesByTaskTypes(filtered, selectedTaskTypes);
  
  // Apply sorting
  return sortCases(filtered, sortOption);
}
