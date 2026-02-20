import type { CompletedTasks } from '../../backend';

export interface ChecklistItem {
  key: keyof CompletedTasks;
  label: string;
  defaultChecked: boolean;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: 'dischargeNotes', label: 'Discharge Notes', defaultChecked: true },
  { key: 'pdvmNotified', label: 'pDVM Notified', defaultChecked: true },
  { key: 'labs', label: 'Labs', defaultChecked: false },
  { key: 'histo', label: 'Histo', defaultChecked: false },
  { key: 'surgeryReport', label: 'Surgery Report', defaultChecked: false },
  { key: 'imaging', label: 'Imaging', defaultChecked: false },
  { key: 'culture', label: 'Culture', defaultChecked: false },
];

export function getDefaultTaskSelection(): CompletedTasks {
  return {
    dischargeNotes: true,
    pdvmNotified: true,
    labs: false,
    histo: false,
    surgeryReport: false,
    imaging: false,
    culture: false,
  };
}

export interface RemainingItem {
  key: keyof CompletedTasks;
  label: string;
}

export function getSelectedTasks(completedTasks: CompletedTasks): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => {
    const taskValue = completedTasks[item.key];
    return taskValue !== undefined;
  });
}

export function getRemainingItems(completedTasks: CompletedTasks): RemainingItem[] {
  return CHECKLIST_ITEMS.filter((item) => {
    const taskValue = completedTasks[item.key];
    return taskValue === false;
  }).map((item) => ({
    key: item.key,
    label: item.label,
  }));
}

export function getRemainingTaskCount(completedTasks: CompletedTasks): number {
  return CHECKLIST_ITEMS.filter((item) => completedTasks[item.key] === false).length;
}
