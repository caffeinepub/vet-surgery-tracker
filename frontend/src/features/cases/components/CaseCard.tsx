import { useState } from 'react';
import type { SurgeryCase, Task } from '../../../backend';
import { Species, Sex } from '../../../backend';
import { CHECKLIST_ITEMS, getTaskBackgroundColor } from '../checklist';
import { Pencil, CheckCircle2 } from 'lucide-react';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
  onTaskClick?: (caseId: bigint, taskKey: string, completed: boolean) => void;
  onEditClick?: (surgeryCase: SurgeryCase) => void;
  size?: 'default' | 'dashboard';
  highlighted?: boolean;
}

function getSpeciesIcon(species: Species, size: 'default' | 'dashboard' = 'default') {
  const iconSize = size === 'dashboard' ? 'w-10 h-10' : 'w-7 h-7';
  const iconMap: Record<string, string> = {
    [Species.canine]: '/assets/Dog icon.ico',
    [Species.feline]: '/assets/Cat icon.ico',
    [Species.other]: '/assets/Other icon.ico',
  };
  const altMap: Record<string, string> = {
    [Species.canine]: 'Canine',
    [Species.feline]: 'Feline',
    [Species.other]: 'Other',
  };
  return (
    <img
      src={iconMap[species] ?? '/assets/Other icon.ico'}
      alt={altMap[species] ?? 'Other'}
      className={`${iconSize} object-contain`}
    />
  );
}

function formatSex(sex: Sex): string {
  switch (sex) {
    case Sex.male: return 'M';
    case Sex.maleNeutered: return 'MN';
    case Sex.female: return 'F';
    case Sex.femaleSpayed: return 'FS';
    default: return '';
  }
}

function formatAge(dateOfBirth?: bigint): string {
  if (!dateOfBirth) return '';
  const dob = new Date(Number(dateOfBirth) / 1_000_000);
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths}mo`;
  return `${Math.floor(totalMonths / 12)}yr`;
}

function formatDate(time: bigint): string {
  const date = new Date(Number(time) / 1_000_000);
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}

function getTaskField<K extends keyof Task>(task: Task, field: K): boolean {
  return (task as unknown as Record<string, boolean>)[field as string] ?? false;
}

export default function CaseCard({ surgeryCase, onTaskClick, onEditClick, size = 'default', highlighted = false }: CaseCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isDashboard = size === 'dashboard';

  const selectedTasks = CHECKLIST_ITEMS.filter(item =>
    getTaskField(surgeryCase.task, item.selectedField)
  );

  const remainingTasks = selectedTasks.filter(item =>
    !getTaskField(surgeryCase.task, item.completedField)
  );

  const allCompleted = selectedTasks.length > 0 && remainingTasks.length === 0;

  return (
    <div
      className={`rounded-lg border bg-card shadow-sm transition-all ${
        highlighted ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${allCompleted ? 'opacity-70' : ''} ${isDashboard ? 'text-base' : 'text-sm'}`}
    >
      {/* Header */}
      <div
        className={`flex items-start gap-3 cursor-pointer select-none ${isDashboard ? 'p-4' : 'p-3'}`}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Species Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getSpeciesIcon(surgeryCase.species, size)}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-foreground truncate ${isDashboard ? 'text-lg' : 'text-sm'}`}>
            {surgeryCase.petName}
            <span className={`font-normal text-muted-foreground ml-2 ${isDashboard ? 'text-sm' : 'text-xs'}`}>
              {surgeryCase.ownerLastName}
            </span>
          </div>
          <div className={`text-muted-foreground flex items-center gap-2 flex-wrap ${isDashboard ? 'text-sm' : 'text-xs'}`}>
            <span className="font-mono">{surgeryCase.medicalRecordNumber}</span>
            <span>·</span>
            <span>{formatSex(surgeryCase.sex)}</span>
            {surgeryCase.dateOfBirth && (
              <>
                <span>·</span>
                <span>{formatAge(surgeryCase.dateOfBirth)}</span>
              </>
            )}
            <span>·</span>
            <span>{formatDate(surgeryCase.arrivalDate)}</span>
          </div>
          {/* Presenting Complaint — always visible */}
          {surgeryCase.presentingComplaint && surgeryCase.presentingComplaint.trim() ? (
            <div className={`mt-1 text-foreground/80 truncate ${isDashboard ? 'text-sm' : 'text-xs'}`}>
              <span className="font-medium text-muted-foreground">Complaint:</span>{' '}
              <span>{surgeryCase.presentingComplaint}</span>
            </div>
          ) : (
            <div className={`mt-1 italic text-muted-foreground/60 ${isDashboard ? 'text-sm' : 'text-xs'}`}>
              No complaint recorded
            </div>
          )}
        </div>

        {/* Task icons */}
        <div className="flex flex-wrap gap-1 justify-end max-w-[90px] flex-shrink-0">
          {selectedTasks.map(item => {
            const isCompleted = getTaskField(surgeryCase.task, item.completedField);
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                title={`${item.label}${isCompleted ? ' (completed)' : ' (pending)'}`}
                className="relative"
              >
                <Icon
                  className={`${isDashboard ? 'w-5 h-5' : 'w-4 h-4'} ${
                    isCompleted
                      ? 'opacity-30'
                      : item.iconColorClass
                  }`}
                />
                {isCompleted && (
                  <CheckCircle2
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-green-500"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Edit button */}
        {onEditClick && (
          <button
            onClick={e => { e.stopPropagation(); onEditClick(surgeryCase); }}
            className="flex-shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Edit case"
          >
            <Pencil className={isDashboard ? 'w-5 h-5' : 'w-4 h-4'} />
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className={`border-t border-border ${isDashboard ? 'px-4 pb-4 pt-3' : 'px-3 pb-3 pt-2'}`}>
          {surgeryCase.breed && (
            <div className={`text-muted-foreground mb-2 ${isDashboard ? 'text-sm' : 'text-xs'}`}>
              <span className="font-medium text-foreground">Breed:</span> {surgeryCase.breed}
            </div>
          )}
          {surgeryCase.notes && (
            <div className={`mb-3 ${isDashboard ? 'text-sm' : 'text-xs'}`}>
              <span className="font-medium text-foreground">Notes:</span>{' '}
              <span className="text-muted-foreground">{surgeryCase.notes}</span>
            </div>
          )}

          {/* Task pills with icons */}
          {selectedTasks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedTasks.map(item => {
                const isCompleted = getTaskField(surgeryCase.task, item.completedField);
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => onTaskClick?.(surgeryCase.id, item.key, !isCompleted)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                      isCompleted
                        ? 'bg-green-100 border-green-300 text-green-800 line-through opacity-60'
                        : `${getTaskBackgroundColor(item.color)} border-current text-foreground hover:opacity-80`
                    }`}
                  >
                    <Icon
                      className={`w-3 h-3 flex-shrink-0 ${isCompleted ? 'text-green-600' : item.iconColorClass}`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {selectedTasks.length === 0 && (
            <div className={`text-muted-foreground italic ${isDashboard ? 'text-sm' : 'text-xs'}`}>
              No tasks assigned
            </div>
          )}
        </div>
      )}
    </div>
  );
}
