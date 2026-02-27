import { Task } from '../../backend';

export interface ChecklistItem {
  workflowType: string;
  label: string;
  selectedField: keyof Task;
  completedField: keyof Task;
  defaultSelected: boolean;
  color: string;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    workflowType: 'dischargeNotes',
    label: 'Discharge Notes',
    selectedField: 'dischargeNotesSelected',
    completedField: 'dischargeNotesCompleted',
    defaultSelected: true,
    color: '#22C55E',
  },
  {
    workflowType: 'pdvmNotified',
    label: 'PDVM Notified',
    selectedField: 'pdvmNotifiedSelected',
    completedField: 'pdvmNotifiedCompleted',
    defaultSelected: true,
    color: '#EAB308',
  },
  {
    workflowType: 'labs',
    label: 'Labs',
    selectedField: 'labsSelected',
    completedField: 'labsCompleted',
    defaultSelected: false,
    color: '#F97316',
  },
  {
    workflowType: 'histo',
    label: 'Histo',
    selectedField: 'histoSelected',
    completedField: 'histoCompleted',
    defaultSelected: false,
    color: '#A855F7',
  },
  {
    workflowType: 'surgeryReport',
    label: 'Surgery Report',
    selectedField: 'surgeryReportSelected',
    completedField: 'surgeryReportCompleted',
    defaultSelected: true,
    color: '#EF4444',
  },
  {
    workflowType: 'imaging',
    label: 'Imaging',
    selectedField: 'imagingSelected',
    completedField: 'imagingCompleted',
    defaultSelected: false,
    color: '#6B7280',
  },
  {
    workflowType: 'culture',
    label: 'Culture',
    selectedField: 'cultureSelected',
    completedField: 'cultureCompleted',
    defaultSelected: false,
    color: '#EC4899',
  },
  {
    workflowType: 'followUp',
    label: 'Follow Up',
    selectedField: 'followUpSelected',
    completedField: 'followUpCompleted',
    defaultSelected: false,
    color: '#06B6D4',
  },
  {
    workflowType: 'dailySummary',
    label: 'Daily Summary',
    selectedField: 'dailySummarySelected' as keyof Task,
    completedField: 'dailySummaryCompleted' as keyof Task,
    defaultSelected: false,
    color: '#3B82F6',
  },
];

export function getDefaultTaskSelections(): Record<string, boolean> {
  const selections: Record<string, boolean> = {};
  for (const item of CHECKLIST_ITEMS) {
    selections[item.workflowType] = item.defaultSelected;
  }
  return selections;
}

export function getRemainingChecklistItems(task: Task): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => {
    const selected = task[item.selectedField];
    const completed = task[item.completedField];
    return selected === true && completed !== true;
  });
}

export function getAllSelectedChecklistItems(task: Task): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => {
    return task[item.selectedField] === true;
  });
}

export function getTaskColor(workflowType: string): string {
  const item = CHECKLIST_ITEMS.find((i) => i.workflowType === workflowType);
  return item?.color ?? '#6B7280';
}
