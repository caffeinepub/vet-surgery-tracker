import type { Task } from '../../backend';

export interface ChecklistItem {
  key: string;
  label: string;
  defaultSelected: boolean;
  selectedField: keyof Task;
  completedField: keyof Task;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { 
    key: 'dischargeNotes', 
    label: 'Discharge Notes', 
    defaultSelected: true,
    selectedField: 'dischargeNotesSelected',
    completedField: 'dischargeNotesCompleted'
  },
  { 
    key: 'pdvmNotified', 
    label: 'pDVM Notified', 
    defaultSelected: true,
    selectedField: 'pdvmNotifiedSelected',
    completedField: 'pdvmNotifiedCompleted'
  },
  { 
    key: 'labs', 
    label: 'Labs', 
    defaultSelected: false,
    selectedField: 'labsSelected',
    completedField: 'labsCompleted'
  },
  { 
    key: 'histo', 
    label: 'Histo', 
    defaultSelected: false,
    selectedField: 'histoSelected',
    completedField: 'histoCompleted'
  },
  { 
    key: 'surgeryReport', 
    label: 'Surgery Report', 
    defaultSelected: false,
    selectedField: 'surgeryReportSelected',
    completedField: 'surgeryReportCompleted'
  },
  { 
    key: 'imaging', 
    label: 'Imaging', 
    defaultSelected: false,
    selectedField: 'imagingSelected',
    completedField: 'imagingCompleted'
  },
  { 
    key: 'culture', 
    label: 'Culture', 
    defaultSelected: false,
    selectedField: 'cultureSelected',
    completedField: 'cultureCompleted'
  },
];

export function getDefaultTaskSelections(): Task {
  return {
    dischargeNotesSelected: true,
    dischargeNotesCompleted: false,
    pdvmNotifiedSelected: true,
    pdvmNotifiedCompleted: false,
    labsSelected: false,
    labsCompleted: false,
    histoSelected: false,
    histoCompleted: false,
    surgeryReportSelected: false,
    surgeryReportCompleted: false,
    imagingSelected: false,
    imagingCompleted: false,
    cultureSelected: false,
    cultureCompleted: false,
  };
}

export interface RemainingItem {
  key: string;
  label: string;
  selectedField: keyof Task;
  completedField: keyof Task;
}

export function getRemainingChecklistItems(task: Task): RemainingItem[] {
  return CHECKLIST_ITEMS.filter((item) => {
    const isSelected = task[item.selectedField];
    const isCompleted = task[item.completedField];
    return isSelected === true && isCompleted === false;
  }).map((item) => ({
    key: item.key,
    label: item.label,
    selectedField: item.selectedField,
    completedField: item.completedField,
  }));
}

export function getCompletedTaskCount(task: Task): number {
  return CHECKLIST_ITEMS.filter((item) => {
    const isSelected = task[item.selectedField];
    const isCompleted = task[item.completedField];
    return isSelected === true && isCompleted === true;
  }).length;
}

export function getTotalSelectedTaskCount(task: Task): number {
  return CHECKLIST_ITEMS.filter((item) => task[item.selectedField] === true).length;
}
