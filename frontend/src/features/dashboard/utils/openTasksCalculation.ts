import type { SurgeryCase, Species } from '../../../backend';
import { getRemainingChecklistItems } from '../../cases/checklist';

export interface OpenTaskItem {
  caseId: bigint;
  medicalRecordNumber: string;
  petName: string;
  ownerLastName: string;
  species: Species;
  presentingComplaint: string;
  taskType: string;
  taskLabel: string;
}

/**
 * Extracts all open tasks from a single case
 */
export function getOpenTasksFromCase(surgeryCase: SurgeryCase): OpenTaskItem[] {
  const remainingTasks = getRemainingChecklistItems(surgeryCase.task);
  
  return remainingTasks.map(task => ({
    caseId: surgeryCase.id,
    medicalRecordNumber: surgeryCase.medicalRecordNumber,
    petName: surgeryCase.petName,
    ownerLastName: surgeryCase.ownerLastName,
    species: surgeryCase.species,
    presentingComplaint: surgeryCase.presentingComplaint,
    taskType: task.key,
    taskLabel: task.label,
  }));
}

/**
 * Calculates the total number of open tasks across all cases
 */
export function getTotalOpenTasksCount(cases: SurgeryCase[]): number {
  return cases.reduce((total, surgeryCase) => {
    const remainingTasks = getRemainingChecklistItems(surgeryCase.task);
    return total + remainingTasks.length;
  }, 0);
}
