import type { Task } from '../../backend';

export interface ChecklistItem {
  key: string;
  label: string;
  defaultSelected: boolean;
  selectedField: keyof Task;
  completedField: keyof Task;
  color: string;
  icon: string;
  iconColorClass: string;
  workflowType: string;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: 'pdvmNotified',
    label: 'PDVM Notified',
    defaultSelected: false,
    selectedField: 'pdvmNotifiedSelected',
    completedField: 'pdvmNotifiedCompleted',
    color: '#EAB308',
    icon: 'notified',
    iconColorClass: 'text-yellow-500',
    workflowType: 'pdvmNotified',
  },
  {
    key: 'histo',
    label: 'Histo',
    defaultSelected: false,
    selectedField: 'histoSelected',
    completedField: 'histoCompleted',
    color: '#A855F7',
    icon: 'histo',
    iconColorClass: 'text-purple-500',
    workflowType: 'histo',
  },
  {
    key: 'labs',
    label: 'Labs',
    defaultSelected: false,
    selectedField: 'labsSelected',
    completedField: 'labsCompleted',
    color: '#F97316',
    icon: 'labs',
    iconColorClass: 'text-orange-500',
    workflowType: 'labs',
  },
  {
    key: 'culture',
    label: 'Culture',
    defaultSelected: false,
    selectedField: 'cultureSelected',
    completedField: 'cultureCompleted',
    color: '#EC4899',
    icon: 'culture',
    iconColorClass: 'text-pink-500',
    workflowType: 'culture',
  },
  {
    key: 'surgeryReport',
    label: 'Surgery Report',
    defaultSelected: true,
    selectedField: 'surgeryReportSelected',
    completedField: 'surgeryReportCompleted',
    color: '#EF4444',
    icon: 'surgery',
    iconColorClass: 'text-red-500',
    workflowType: 'surgeryReport',
  },
  {
    key: 'imaging',
    label: 'Imaging',
    defaultSelected: false,
    selectedField: 'imagingSelected',
    completedField: 'imagingCompleted',
    color: '#3B82F6',
    icon: 'imaging',
    iconColorClass: 'text-blue-500',
    workflowType: 'imaging',
  },
  {
    key: 'dischargeNotes',
    label: 'Discharge Notes',
    defaultSelected: true,
    selectedField: 'dischargeNotesSelected',
    completedField: 'dischargeNotesCompleted',
    color: '#22C55E',
    icon: 'discharge',
    iconColorClass: 'text-green-500',
    workflowType: 'dischargeNotes',
  },
];

export function getDefaultTaskSelections(): Record<string, boolean> {
  return Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.key, item.defaultSelected]));
}

export function getRemainingChecklistItems(task: Task): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => {
    const selected = task[item.selectedField] as boolean;
    const completed = task[item.completedField] as boolean;
    return selected && !completed;
  });
}

export function getTaskColor(workflowType: string): string {
  const item = CHECKLIST_ITEMS.find((i) => i.workflowType === workflowType);
  return item?.color ?? '#6B7280';
}

export function getTaskIconColorClass(workflowType: string): string {
  const item = CHECKLIST_ITEMS.find((i) => i.workflowType === workflowType);
  return item?.iconColorClass ?? 'text-gray-500';
}
