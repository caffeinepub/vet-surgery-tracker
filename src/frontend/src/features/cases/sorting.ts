import type { SurgeryCase } from '../../backend';
import { getRemainingItems } from './checklist';

export type SortOption =
  | 'arrival-date-newest'
  | 'arrival-date-oldest'
  | 'open-tasks-most'
  | 'open-tasks-fewest';

export interface SortOptionConfig {
  value: SortOption;
  label: string;
}

export const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'arrival-date-newest', label: 'Arrival Date (Newest First)' },
  { value: 'arrival-date-oldest', label: 'Arrival Date (Oldest First)' },
  { value: 'open-tasks-most', label: 'Open Tasks (Most First)' },
  { value: 'open-tasks-fewest', label: 'Open Tasks (Fewest First)' },
];

function countOpenTasks(surgeryCase: SurgeryCase): number {
  return getRemainingItems(surgeryCase.completedTasks).length;
}

export function sortCases(cases: SurgeryCase[], sortOption: SortOption): SurgeryCase[] {
  // Create a copy to avoid mutating the original array
  const casesCopy = [...cases];

  switch (sortOption) {
    case 'arrival-date-newest':
      return casesCopy.sort((a, b) => {
        // Sort descending (newest first)
        return Number(b.arrivalDate - a.arrivalDate);
      });

    case 'arrival-date-oldest':
      return casesCopy.sort((a, b) => {
        // Sort ascending (oldest first)
        return Number(a.arrivalDate - b.arrivalDate);
      });

    case 'open-tasks-most':
      return casesCopy.sort((a, b) => {
        const aCount = countOpenTasks(a);
        const bCount = countOpenTasks(b);
        // Sort descending (most tasks first)
        if (bCount !== aCount) {
          return bCount - aCount;
        }
        // Secondary sort by arrival date (newest first) for stable ordering
        return Number(b.arrivalDate - a.arrivalDate);
      });

    case 'open-tasks-fewest':
      return casesCopy.sort((a, b) => {
        const aCount = countOpenTasks(a);
        const bCount = countOpenTasks(b);
        // Sort ascending (fewest tasks first)
        if (aCount !== bCount) {
          return aCount - bCount;
        }
        // Secondary sort by arrival date (newest first) for stable ordering
        return Number(b.arrivalDate - a.arrivalDate);
      });

    default:
      return casesCopy;
  }
}
