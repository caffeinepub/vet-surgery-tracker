import type { Checklist } from '../../backend';

export interface ChecklistItem {
  key: keyof Checklist;
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

export function getDefaultChecklist(): Checklist {
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

export function getRemainingItems(checklist: Checklist): string[] {
  return CHECKLIST_ITEMS.filter((item) => checklist[item.key]).map((item) => item.label);
}
