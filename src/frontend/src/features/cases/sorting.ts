import type { SurgeryCase } from '../../backend';
import { getRemainingChecklistItems } from './checklist';

export type SortOption = 'arrival-date-newest' | 'arrival-date-oldest' | 'open-tasks-most' | 'open-tasks-fewest';

export const SORT_OPTIONS = [
  { value: 'arrival-date-newest' as const, label: 'Arrival Date (Newest First)' },
  { value: 'arrival-date-oldest' as const, label: 'Arrival Date (Oldest First)' },
  { value: 'open-tasks-most' as const, label: 'Open Tasks (Most First)' },
  { value: 'open-tasks-fewest' as const, label: 'Open Tasks (Fewest First)' },
];

export function sortCases(cases: SurgeryCase[], sortOption: SortOption): SurgeryCase[] {
  const sorted = [...cases];

  switch (sortOption) {
    case 'arrival-date-newest':
      return sorted.sort((a, b) => Number(b.arrivalDate - a.arrivalDate));
    case 'arrival-date-oldest':
      return sorted.sort((a, b) => Number(a.arrivalDate - b.arrivalDate));
    case 'open-tasks-most':
      return sorted.sort((a, b) => getRemainingTaskCount(b) - getRemainingTaskCount(a));
    case 'open-tasks-fewest':
      return sorted.sort((a, b) => getRemainingTaskCount(a) - getRemainingTaskCount(b));
    default:
      return sorted;
  }
}

function getRemainingTaskCount(surgeryCase: SurgeryCase): number {
  return getRemainingChecklistItems(surgeryCase.task).length;
}
