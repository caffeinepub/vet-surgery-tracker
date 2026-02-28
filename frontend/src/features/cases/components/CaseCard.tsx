import React, { useState } from 'react';
import { SurgeryCase, Species } from '../../../backend';
import { CHECKLIST_ITEMS } from '../checklist';
import WorkflowIcon from '../../../components/workflow-icons/WorkflowIcon';
import ChecklistEditor from './ChecklistEditor';
import CaseEditDialog from './CaseEditDialog';
import { useUpdateTaskCompletion, useDeleteCase } from '../../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { TaskType } from '../../../backend';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
  isHighlighted?: boolean;
  onHighlightClear?: () => void;
  showPresentingComplaintCollapsed?: boolean;
}

function bigintToDateString(time: bigint): string {
  const ms = Number(time) / 1_000_000;
  const date = new Date(ms);
  if (isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function getSpeciesIcon(species: Species): string {
  switch (species) {
    case Species.canine: return '/assets/Dog Icon 3.ico';
    case Species.feline: return '/assets/Cat Icon 3.ico';
    default: return '/assets/Other Icon 3.ico';
  }
}

function getSpeciesLabel(species: Species): string {
  switch (species) {
    case Species.canine: return 'Canine';
    case Species.feline: return 'Feline';
    default: return 'Other';
  }
}

function getSexLabel(sex: string): string {
  switch (sex) {
    case 'male': return 'Male';
    case 'maleNeutered': return 'Male Neutered';
    case 'female': return 'Female';
    case 'femaleSpayed': return 'Female Spayed';
    default: return sex;
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

export function CaseCard({ surgeryCase, isHighlighted = false, onHighlightClear }: CaseCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const updateTaskCompletion = useUpdateTaskCompletion();
  const deleteCase = useDeleteCase();

  const selectedItems = CHECKLIST_ITEMS.filter(
    (item) => surgeryCase.task[item.selectedField] === true
  );

  const allCompleted =
    selectedItems.length > 0 &&
    selectedItems.every((item) => surgeryCase.task[item.completedField] === true);

  const handleToggleTask = (workflowType: string) => {
    const taskType = WORKFLOW_TO_TASK_TYPE[workflowType];
    if (!taskType) return;
    updateTaskCompletion.mutate({ id: surgeryCase.id, taskType });
  };

  const handleDelete = () => {
    if (confirm(`Delete case for ${surgeryCase.petName}?`)) {
      deleteCase.mutate(surgeryCase.id);
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border bg-card shadow-sm transition-all ${
          isHighlighted ? 'ring-2 ring-primary' : ''
        } ${allCompleted ? 'opacity-60' : ''}`}
        onClick={() => { if (onHighlightClear) onHighlightClear(); }}
      >
        {/* Card header with species icon, name, MRN, date, and task icons */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <img
            src={getSpeciesIcon(surgeryCase.species)}
            alt={getSpeciesLabel(surgeryCase.species)}
            width={32}
            height={32}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base">{surgeryCase.petName}</span>
              <span className="text-xs text-muted-foreground">{surgeryCase.medicalRecordNumber}</span>
              <span className="text-xs text-muted-foreground">{bigintToDateString(surgeryCase.arrivalDate)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {surgeryCase.ownerLastName && <span>Owner: {surgeryCase.ownerLastName}</span>}
            </div>
          </div>
          {/* Task icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedItems.map((item) => {
              const isCompleted = surgeryCase.task[item.completedField] === true;
              return (
                <span key={item.workflowType} title={item.label}>
                  <WorkflowIcon workflowType={item.workflowType} isCompleted={isCompleted} />
                </span>
              );
            })}
          </div>
        </div>

        {/* Full patient details — always visible */}
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Species: </span>
              <span>{getSpeciesLabel(surgeryCase.species)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sex: </span>
              <span>{getSexLabel(surgeryCase.sex)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Breed: </span>
              <span>{surgeryCase.breed || '—'}</span>
            </div>
            {surgeryCase.dateOfBirth && (
              <div>
                <span className="text-muted-foreground">DOB: </span>
                <span>{bigintToDateString(surgeryCase.dateOfBirth)}</span>
              </div>
            )}
          </div>
          {surgeryCase.presentingComplaint && (
            <div className="text-sm">
              <span className="text-muted-foreground">Presenting Complaint: </span>
              <span>{surgeryCase.presentingComplaint}</span>
            </div>
          )}
          {surgeryCase.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes: </span>
              <span className="whitespace-pre-wrap">{surgeryCase.notes}</span>
            </div>
          )}
          {selectedItems.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Tasks</p>
              <ChecklistEditor
                task={surgeryCase.task}
                onToggleTask={handleToggleTask}
                isLoading={updateTaskCompletion.isPending}
              />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            >
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={deleteCase.isPending}
            >
              <Trash2 size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
      <CaseEditDialog open={editOpen} onOpenChange={setEditOpen} surgeryCase={surgeryCase} />
    </>
  );
}

export default CaseCard;
