import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SurgeryCase } from '../../../backend';
import { Species, Sex } from '../../../backend';
import { CHECKLIST_ITEMS, getRemainingChecklistItems } from '../checklist';
import { WorkflowIcon } from '../../../components/workflow-icons/WorkflowIcon';
import CaseEditDialog from './CaseEditDialog';
import { ChecklistEditor } from './ChecklistEditor';
import { useUpdateTaskCompletion, useDeleteCase } from '../../../hooks/useQueries';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
  isHighlighted?: boolean;
  onHighlightClear?: () => void;
  onNavigateToCase?: (caseId: number) => void;
}

function formatDate(time: bigint): string {
  try {
    const ms = Number(time) / 1_000_000;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

function getSpeciesIcon(species: Species): string {
  switch (species) {
    case Species.canine:
      return '/assets/Dog icon.ico';
    case Species.feline:
      return '/assets/Cat icon.ico';
    default:
      return '/assets/Other icon.ico';
  }
}

function getSexLabel(sex: Sex): string {
  switch (sex) {
    case Sex.male:
      return 'M';
    case Sex.maleNeutered:
      return 'MN';
    case Sex.female:
      return 'F';
    case Sex.femaleSpayed:
      return 'FS';
    default:
      return '—';
  }
}

export function CaseCard({ surgeryCase, isHighlighted, onHighlightClear, onNavigateToCase }: CaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const updateTaskCompletion = useUpdateTaskCompletion();
  const deleteCase = useDeleteCase();

  const remainingItems = getRemainingChecklistItems(surgeryCase.task);
  const allTasksCompleted = remainingItems.length === 0;

  const selectedItems = CHECKLIST_ITEMS.filter(
    (item) => surgeryCase.task[item.selectedField] === true
  );

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsExpanded(true);
      onHighlightClear?.();
    }
  }, [isHighlighted, onHighlightClear]);

  const handleToggleTask = async (taskType: string) => {
    try {
      await updateTaskCompletion.mutateAsync({
        id: surgeryCase.id,
        taskType: taskType as import('../../../backend').TaskType,
      });
    } catch {
      // silently ignore
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete case for ${surgeryCase.petName}?`)) return;
    try {
      await deleteCase.mutateAsync(surgeryCase.id);
    } catch {
      // silently ignore
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          'bg-card border border-border rounded-xl overflow-hidden transition-all duration-200',
          isHighlighted && 'ring-2 ring-primary',
          allTasksCompleted && 'opacity-75'
        )}
      >
        {/* Card header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
          onClick={() => setIsExpanded((v) => !v)}
        >
          {/* Species icon */}
          <img
            src={getSpeciesIcon(surgeryCase.species)}
            alt={surgeryCase.species}
            className="h-8 w-8 object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* Patient info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">
                {surgeryCase.petName}
              </span>
              <span className="text-muted-foreground text-sm">
                {surgeryCase.ownerLastName}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {getSexLabel(surgeryCase.sex)}
              </Badge>
              {surgeryCase.medicalRecordNumber && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  #{surgeryCase.medicalRecordNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {formatDate(surgeryCase.arrivalDate)}
              </span>
              {surgeryCase.breed && (
                <span className="text-xs text-muted-foreground truncate">· {surgeryCase.breed}</span>
              )}
            </div>
          </div>

          {/* Workflow icon strip */}
          <div className="flex items-center gap-1 shrink-0">
            {selectedItems.map((item) => {
              const isCompleted = surgeryCase.task[item.completedField] === true;
              return (
                <div
                  key={item.key}
                  className={cn(
                    'transition-opacity',
                    isCompleted ? 'opacity-30' : 'opacity-100'
                  )}
                  title={item.label}
                >
                  <WorkflowIcon type={item.workflowType} />
                </div>
              );
            })}
            {allTasksCompleted && selectedItems.length > 0 && (
              <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
            )}
          </div>

          {/* Expand chevron */}
          <div className="shrink-0 text-muted-foreground">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-border px-4 py-3 space-y-3">
            {/* Presenting complaint */}
            {surgeryCase.presentingComplaint && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Complaint: </span>
                <span className="text-foreground">{surgeryCase.presentingComplaint}</span>
              </div>
            )}

            {/* Notes */}
            {surgeryCase.notes && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Notes: </span>
                <span className="text-foreground">{surgeryCase.notes}</span>
              </div>
            )}

            {/* Task checklist */}
            {selectedItems.length > 0 && (
              <ChecklistEditor
                task={surgeryCase.task}
                onToggleTask={handleToggleTask}
                isLoading={updateTaskCompletion.isPending}
              />
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditOpen(true);
                }}
                className="gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                Edit
              </Button>
              {onNavigateToCase && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToCase(Number(surgeryCase.id));
                  }}
                  className="gap-1"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="gap-1 text-destructive hover:text-destructive ml-auto"
                disabled={deleteCase.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit dialog rendered outside the card to avoid click propagation issues */}
      <CaseEditDialog
        surgeryCase={surgeryCase}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
