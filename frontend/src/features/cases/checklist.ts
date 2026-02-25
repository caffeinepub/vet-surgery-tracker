import type { Task } from '../../backend';
import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Phone,
  FlaskConical,
  Microscope,
  ScanLine,
  ClipboardList,
  TestTube,
} from 'lucide-react';
import type { WorkflowType } from '../../components/workflow-icons/WorkflowIcon';

export interface ChecklistItem {
  key: string;
  label: string;
  defaultSelected: boolean;
  selectedField: keyof Task;
  completedField: keyof Task;
  color: string;
  icon: LucideIcon;
  iconColorClass: string;
  workflowType: WorkflowType;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: 'dischargeNotes',
    label: 'Discharge Notes',
    defaultSelected: true,
    selectedField: 'dischargeNotesSelected',
    completedField: 'dischargeNotesCompleted',
    color: 'green',
    icon: FileText,
    iconColorClass: 'text-green-500',
    workflowType: 'discharge',
  },
  {
    key: 'pdvmNotified',
    label: 'pDVM Notified',
    defaultSelected: true,
    selectedField: 'pdvmNotifiedSelected',
    completedField: 'pdvmNotifiedCompleted',
    color: 'yellow',
    icon: Phone,
    iconColorClass: 'text-yellow-500',
    workflowType: 'notified',
  },
  {
    key: 'labs',
    label: 'Labs',
    defaultSelected: false,
    selectedField: 'labsSelected',
    completedField: 'labsCompleted',
    color: 'orange',
    icon: FlaskConical,
    iconColorClass: 'text-orange-500',
    workflowType: 'labs',
  },
  {
    key: 'histo',
    label: 'Histo',
    defaultSelected: false,
    selectedField: 'histoSelected',
    completedField: 'histoCompleted',
    color: 'purple',
    icon: Microscope,
    iconColorClass: 'text-purple-500',
    workflowType: 'histo',
  },
  {
    key: 'surgeryReport',
    label: 'Surgery Report',
    defaultSelected: false,
    selectedField: 'surgeryReportSelected',
    completedField: 'surgeryReportCompleted',
    color: 'red',
    icon: ClipboardList,
    iconColorClass: 'text-red-500',
    workflowType: 'surgery',
  },
  {
    key: 'imaging',
    label: 'Imaging',
    defaultSelected: false,
    selectedField: 'imagingSelected',
    completedField: 'imagingCompleted',
    color: 'blue',
    icon: ScanLine,
    iconColorClass: 'text-blue-500',
    workflowType: 'imaging',
  },
  {
    key: 'culture',
    label: 'Culture',
    defaultSelected: false,
    selectedField: 'cultureSelected',
    completedField: 'cultureCompleted',
    color: 'pink',
    icon: TestTube,
    iconColorClass: 'text-pink-500',
    workflowType: 'culture',
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
  color: string;
  icon: LucideIcon;
  iconColorClass: string;
  workflowType: WorkflowType;
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
    color: item.color,
    icon: item.icon,
    iconColorClass: item.iconColorClass,
    workflowType: item.workflowType,
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

export function getTaskBorderColor(color: string): string {
  const colorMap: Record<string, string> = {
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    orange: 'border-orange-500',
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    red: 'border-red-500',
    pink: 'border-pink-500',
  };
  return colorMap[color] || 'border-border';
}

export function getTaskBackgroundColor(color: string): string {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-950/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/20',
    orange: 'bg-orange-50 dark:bg-orange-950/20',
    purple: 'bg-purple-50 dark:bg-purple-950/20',
    blue: 'bg-blue-50 dark:bg-blue-950/20',
    red: 'bg-red-50 dark:bg-red-950/20',
    pink: 'bg-pink-50 dark:bg-pink-950/20',
  };
  return colorMap[color] || 'bg-background';
}
