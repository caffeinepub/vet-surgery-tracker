import type { SurgeryCase, Task } from '../../../backend';
import { CHECKLIST_ITEMS } from '../../cases/checklist';

export interface OpenTaskItem {
  caseId: bigint;
  medicalRecordNumber: string;
  petName: string;
  ownerLastName: string;
  taskType: string;
  taskLabel: string;
}

export function getOpenTasksFromCase(surgeryCase: SurgeryCase): OpenTaskItem[] {
  const openTasks: OpenTaskItem[] = [];

  for (const item of CHECKLIST_ITEMS) {
    const isSelected = surgeryCase.task[item.selectedField];
    const isCompleted = surgeryCase.task[item.completedField];

    if (isSelected === true && isCompleted === false) {
      openTasks.push({
        caseId: surgeryCase.id,
        medicalRecordNumber: surgeryCase.medicalRecordNumber,
        petName: surgeryCase.petName,
        ownerLastName: surgeryCase.ownerLastName,
        taskType: item.key,
        taskLabel: item.label,
      });
    }
  }

  return openTasks;
}

export function getTotalOpenTasksCount(cases: SurgeryCase[]): number {
  let count = 0;
  for (const surgeryCase of cases) {
    count += getOpenTasksFromCase(surgeryCase).length;
  }
  return count;
}
