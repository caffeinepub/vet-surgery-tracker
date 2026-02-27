import React from 'react';
import { SurgeryCase, Species, TaskType } from '../../../backend';
import { CHECKLIST_ITEMS } from '../checklist';
import WorkflowIcon from '../../../components/workflow-icons/WorkflowIcon';
import { useUpdateTaskCompletion } from '../../../hooks/useQueries';

interface CalendarCaseCardProps {
  surgeryCase: SurgeryCase;
  onNavigateToCase?: (caseId: number) => void;
}

function getSpeciesIcon(species: Species): string {
  switch (species) {
    case Species.canine: return '/assets/Dog Icon 3.ico';
    case Species.feline: return '/assets/Cat Icon 3.ico';
    default: return '/assets/Other Icon 3.ico';
  }
}

// Map workflowType string to TaskType enum
const WORKFLOW_TO_TASK_TYPE: Record<string, TaskType> = {
  dischargeNotes: TaskType.dischargeNotes,
  pdvmNotified: TaskType.pdvmNotified,
  labs: TaskType.labs,
  histo: TaskType.histo,
  surgeryReport: TaskType.surgeryReport,
  imaging: TaskType.imaging,
  culture: TaskType.culture,
  followUp: TaskType.followUp,
  dailySummary: TaskType.dailySummary,
};

export function CalendarCaseCard({ surgeryCase, onNavigateToCase }: CalendarCaseCardProps) {
  const updateTaskCompletion = useUpdateTaskCompletion();

  const selectedItems = CHECKLIST_ITEMS.filter(
    (item) => surgeryCase.task[item.selectedField] === true
  );

  const allCompleted =
    selectedItems.length > 0 &&
    selectedItems.every((item) => surgeryCase.task[item.completedField] === true);

  const handleToggleTask = (workflowType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const taskType = WORKFLOW_TO_TASK_TYPE[workflowType];
    if (!taskType) return;
    updateTaskCompletion.mutate({ id: surgeryCase.id, taskType });
  };

  const handleCardClick = () => {
    onNavigateToCase?.(Number(surgeryCase.id));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      className={`rounded border bg-card p-2 shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-primary/40 hover:bg-accent/30 ${
        allCompleted ? 'opacity-50' : ''
      }`}
    >
      {/* Header row: species icon + pet name + last name + MRN */}
      <div className="flex items-center gap-1.5 mb-1">
        <img
          src={getSpeciesIcon(surgeryCase.species)}
          alt=""
          width={13}
          height={13}
          className="flex-shrink-0"
        />
        <span className="font-semibold text-sm truncate">
          {surgeryCase.petName}
          {surgeryCase.ownerLastName && (
            <span className="font-normal text-muted-foreground"> ({surgeryCase.ownerLastName})</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{surgeryCase.medicalRecordNumber}</span>
      </div>
      {/* Presenting complaint */}
      {surgeryCase.presentingComplaint && (
        <p className="text-sm text-muted-foreground truncate mb-1.5">{surgeryCase.presentingComplaint}</p>
      )}
      {/* Task icons — smaller size via scale */}
      <div className="flex flex-wrap gap-0.5">
        {selectedItems.map((item) => {
          const isCompleted = surgeryCase.task[item.completedField] === true;
          return (
            <button
              key={item.workflowType}
              title={`${item.label}${isCompleted ? ' (completed)' : ''}`}
              onClick={(e) => handleToggleTask(item.workflowType, e)}
              disabled={updateTaskCompletion.isPending}
              className={`transition-opacity flex items-center justify-center ${isCompleted ? 'opacity-50' : 'opacity-100'} hover:opacity-70`}
              style={{ transform: 'scale(0.72)', transformOrigin: 'center' }}
            >
              <WorkflowIcon workflowType={item.workflowType} isCompleted={isCompleted} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarCaseCard;
