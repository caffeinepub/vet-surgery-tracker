import { useState } from 'react';
import type { SurgeryCase, Species, Sex } from '../../../backend';
import { cn } from '@/lib/utils';
import {
  CHECKLIST_ITEMS,
  getTaskBorderColor,
  getTaskBackgroundColor,
  getRemainingChecklistItems,
} from '../checklist';
import { useUpdateTask } from '../../../hooks/useQueries';
import { nanosecondsToDate } from '../validation';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
  isHighlighted?: boolean;
}

function SpeciesIcon({ species }: { species: Species }) {
  if (species === 'canine') {
    return (
      <img
        src="/assets/generated/dog-silhouette.dim_64x64.png"
        alt="Canine"
        title="Canine"
        className="w-6 h-6 object-contain shrink-0"
      />
    );
  }
  if (species === 'feline') {
    return (
      <img
        src="/assets/generated/cat-silhouette.dim_64x64.png"
        alt="Feline"
        title="Feline"
        className="w-6 h-6 object-contain shrink-0"
      />
    );
  }
  return (
    <img
      src="/assets/generated/other-animal-silhouette.dim_64x64.png"
      alt="Other"
      title="Other"
      className="w-6 h-6 object-contain shrink-0"
    />
  );
}

function formatAge(dateOfBirth?: bigint): string {
  if (!dateOfBirth) return '';
  const dob = nanosecondsToDate(dateOfBirth);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth()) +
    (now.getDate() < dob.getDate() ? -1 : 0);
  const months = Math.max(0, totalMonths);
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}mo`;
  if (m === 0) return `${y}yr`;
  return `${y}yr ${m}mo`;
}

function formatSex(sex: Sex): string {
  switch (sex) {
    case 'male': return 'M';
    case 'female': return 'F';
    case 'maleNeutered': return 'MN';
    case 'femaleSpayed': return 'FS';
    default: return '';
  }
}

function formatArrivalDate(arrivalDate: bigint): string {
  const date = nanosecondsToDate(arrivalDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CaseCard({ surgeryCase, isHighlighted }: CaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const updateTaskMutation = useUpdateTask();

  const remainingItems = getRemainingChecklistItems(surgeryCase.task);
  const allCompleted = remainingItems.length === 0;

  const selectedItems = CHECKLIST_ITEMS.filter(
    (item) => surgeryCase.task[item.selectedField] as boolean
  );

  const handleToggleTask = async (completedField: keyof typeof surgeryCase.task) => {
    const isCurrentlyCompleted = surgeryCase.task[completedField] as boolean;
    const updatedTask = {
      ...surgeryCase.task,
      [completedField]: !isCurrentlyCompleted,
    };
    await updateTaskMutation.mutateAsync({
      id: surgeryCase.id,
      task: updatedTask,
    });
  };

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md',
        isHighlighted && 'ring-2 ring-primary ring-offset-1 animate-pulse',
        allCompleted && 'opacity-70'
      )}
    >
      {/* Card Header — always visible, click to expand */}
      <div
        className="px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Left: species icon + name */}
          <div className="flex items-center gap-2 min-w-0">
            <SpeciesIcon species={surgeryCase.species} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">
                  {surgeryCase.petName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatSex(surgeryCase.sex)}
                  {surgeryCase.dateOfBirth ? ` · ${formatAge(surgeryCase.dateOfBirth)}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono font-semibold text-primary">
                  {surgeryCase.medicalRecordNumber}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {surgeryCase.ownerLastName}
                </span>
              </div>
            </div>
          </div>

          {/* Right: task dots + arrival date */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-0.5">
              {selectedItems.map((item) => {
                const isCompleted = surgeryCase.task[item.completedField] as boolean;
                return (
                  <div
                    key={item.key}
                    title={item.label}
                    className={cn(
                      'w-2 h-2 rounded-full border',
                      isCompleted
                        ? 'bg-muted border-muted-foreground/30'
                        : getTaskBackgroundColor(item.color).split(' ')[0] + ' ' + getTaskBorderColor(item.color)
                    )}
                  />
                );
              })}
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatArrivalDate(surgeryCase.arrivalDate)}
            </span>
          </div>
        </div>

        {/* Presenting complaint — always visible, truncated */}
        {surgeryCase.presentingComplaint && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {surgeryCase.presentingComplaint}
          </p>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-border px-3 py-2 space-y-2">
          {/* Breed */}
          {surgeryCase.breed && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Breed:</span> {surgeryCase.breed}
            </p>
          )}

          {/* Notes */}
          {surgeryCase.notes && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Notes:</span> {surgeryCase.notes}
            </p>
          )}

          {/* Tasks */}
          {selectedItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Tasks:</p>
              <div className="flex flex-wrap gap-1">
                {selectedItems.map((item) => {
                  const isCompleted = surgeryCase.task[item.completedField] as boolean;
                  return (
                    <button
                      key={item.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(item.completedField);
                      }}
                      disabled={updateTaskMutation.isPending}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all',
                        isCompleted
                          ? 'line-through opacity-50 bg-muted border-muted-foreground/20 text-muted-foreground'
                          : cn(getTaskBorderColor(item.color), getTaskBackgroundColor(item.color), 'text-foreground')
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
