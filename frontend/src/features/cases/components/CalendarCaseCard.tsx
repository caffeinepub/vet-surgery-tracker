import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SurgeryCase } from '../../../backend';
import { Species } from '../../../backend';
import { CHECKLIST_ITEMS, getRemainingChecklistItems } from '../checklist';
import { WorkflowIcon } from '../../../components/workflow-icons/WorkflowIcon';
import CaseEditDialog from './CaseEditDialog';
import { ChecklistEditor } from './ChecklistEditor';
import { useUpdateTaskCompletion, useDeleteCase } from '../../../hooks/useQueries';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarCaseCardProps {
  surgeryCase: SurgeryCase;
  onNavigateToCase?: (caseId: number) => void;
}

function getSpeciesIcon(species: Species): string {
  switch (species) {
    case Species.canine:
      return '/assets/Dog Icon 3.ico';
    case Species.feline:
      return '/assets/Cat Icon 3.ico';
    default:
      return '/assets/Other Icon 3.ico';
  }
}

export function CalendarCaseCard({ surgeryCase, onNavigateToCase }: CalendarCaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const updateTaskCompletion = useUpdateTaskCompletion();
  const deleteCase = useDeleteCase();

  const remainingItems = getRemainingChecklistItems(surgeryCase.task);
  const allTasksCompleted = remainingItems.length === 0;

  const selectedItems = CHECKLIST_ITEMS.filter(
    (item) => surgeryCase.task[item.selectedField] === true
  );

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

  const presentingComplaint = surgeryCase.presentingComplaint?.trim();

  return (
    <>
      <div
        className={cn(
          'bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 text-left w-full',
          allTasksCompleted && 'opacity-50 bg-muted/40'
        )}
      >
        {/* Collapsed header — always visible */}
        <div
          className="px-2.5 py-2 cursor-pointer select-none"
          onClick={() => setIsExpanded((v) => !v)}
        >
          {/* Top row: species icon + pet name + expand toggle */}
          <div className="flex items-center gap-1.5 mb-1">
            <img
              src={getSpeciesIcon(surgeryCase.species)}
              alt={surgeryCase.species}
              className="h-5 w-5 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="font-semibold text-foreground text-xs leading-tight truncate flex-1 min-w-0">
              {surgeryCase.petName}
            </span>
            <button
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((v) => !v);
              }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* MRN */}
          {surgeryCase.medicalRecordNumber && (
            <p className="text-[10px] text-muted-foreground font-mono mb-1">
              #{surgeryCase.medicalRecordNumber}
            </p>
          )}

          {/* Presenting complaint */}
          {presentingComplaint && (
            <p className="text-[10px] text-foreground/80 leading-tight line-clamp-2 mb-1.5">
              {presentingComplaint}
            </p>
          )}

          {/* Task icons */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-0.5 flex-wrap">
              {selectedItems.map((item) => {
                const isCompleted = surgeryCase.task[item.completedField] === true;
                return (
                  <div
                    key={item.key}
                    className={cn(
                      'transition-opacity',
                      isCompleted ? 'opacity-30' : 'opacity-100'
                    )}
                    style={{ transform: 'scale(0.7)', transformOrigin: 'left center' }}
                  >
                    <WorkflowIcon type={item.workflowType} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="border-t border-border px-2.5 py-2 space-y-2">
            {/* Owner & breed */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{surgeryCase.ownerLastName}</span>
              {surgeryCase.breed && (
                <span className="text-xs text-muted-foreground">· {surgeryCase.breed}</span>
              )}
            </div>

            {/* Checklist */}
            {selectedItems.length > 0 && (
              <ChecklistEditor
                task={surgeryCase.task}
                onToggleTask={handleToggleTask}
                isLoading={updateTaskCompletion.isPending}
              />
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditOpen(true);
                }}
              >
                Edit
              </Button>
              {onNavigateToCase && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToCase(Number(surgeryCase.id));
                  }}
                >
                  View
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 text-destructive hover:text-destructive ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CaseEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        surgeryCase={surgeryCase}
      />
    </>
  );
}
