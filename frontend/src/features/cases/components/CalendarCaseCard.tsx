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
      className={`rounded border bg-card p-2 text-xs shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-primary/40 hover:bg-accent/30 ${
        allCompleted ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <img
          src={getSpeciesIcon(surgeryCase.species)}
          alt=""
          width={16}
          height={16}
          className="flex-shrink-0"
        />
        <span className="font-semibold truncate">
          {surgeryCase.petName}
        </span>
        <span className="text-muted-foreground ml-auto flex-shrink-0">{surgeryCase.medicalRecordNumber}</span>
      </div>
      {surgeryCase.presentingComplaint && (
        <p className="text-muted-foreground truncate mb-1.5">{surgeryCase.presentingComplaint}</p>
      )}
      <div className="flex flex-wrap gap-1">
        {selectedItems.map((item) => {
          const isCompleted = surgeryCase.task[item.completedField] === true;
          return (
            <button
              key={item.workflowType}
              title={`${item.label}${isCompleted ? ' (completed)' : ''}`}
              onClick={(e) => handleToggleTask(item.workflowType, e)}
              disabled={updateTaskCompletion.isPending}
              className={`transition-opacity ${isCompleted ? 'opacity-50' : 'opacity-100'} hover:opacity-70`}
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
