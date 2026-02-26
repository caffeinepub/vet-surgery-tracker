import { useState } from 'react';
import type { SurgeryCase, Task } from '../../../backend';
import { Species, Sex, TaskType } from '../../../backend';
import { CHECKLIST_ITEMS, getTaskBackgroundColor } from '../checklist';
import { useUpdateTaskCompletion } from '../../../hooks/useQueries';
import WorkflowIcon from '../../../components/workflow-icons/WorkflowIcon';
import { Pencil, CheckCircle2, Loader2 } from 'lucide-react';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
  onEditClick?: (surgeryCase: SurgeryCase) => void;
  size?: 'default' | 'dashboard';
  highlighted?: boolean;
}

// Map checklist key strings to TaskType enum values
const TASK_KEY_TO_TYPE: Record<string, TaskType> = {
  dischargeNotes: TaskType.dischargeNotes,
  pdvmNotified: TaskType.pdvmNotified,
  labs: TaskType.labs,
  histo: TaskType.histo,
  surgeryReport: TaskType.surgeryReport,
  imaging: TaskType.imaging,
  culture: TaskType.culture,
};

function getSpeciesIcon(species: Species, size: 'default' | 'dashboard' = 'default') {
  const iconSize = size === 'dashboard' ? 'w-10 h-10' : 'w-7 h-7';
  const iconMap: Record<string, string> = {
    [Species.canine]: '/assets/Dog Icon 3.ico',
    [Species.feline]: '/assets/Cat Icon 3.ico',
    [Species.other]: '/assets/Other Icon 3.ico',
  };
  const altMap: Record<string, string> = {
    [Species.canine]: 'Canine',
    [Species.feline]: 'Feline',
    [Species.other]: 'Other',
  };
  return (
    <img
      src={iconMap[species] ?? '/assets/Other Icon 3.ico'}
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

export default function CaseCard({ surgeryCase, onEditClick, size = 'default', highlighted = false }: CaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const updateTaskCompletion = useUpdateTaskCompletion();

  const isDashboard = size === 'dashboard';

  const selectedTasks = CHECKLIST_ITEMS.filter(item =>
    getTaskField(surgeryCase.task, item.selectedField)
  );

  const remainingTasks = selectedTasks.filter(item =>
    !getTaskField(surgeryCase.task, item.completedField)
  );

  const allCompleted = selectedTasks.length > 0 && remainingTasks.length === 0;

  const handleTaskClick = (taskKey: string) => {
    const taskType = TASK_KEY_TO_TYPE[taskKey];
    if (!taskType) return;
    updateTaskCompletion.mutate({ id: surgeryCase.id, taskType });
  };

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

        {/* Task workflow icons */}
        <div className="flex flex-wrap gap-1 justify-end max-w-[90px] flex-shrink-0">
          {selectedTasks.map(item => {
            const isCompleted = getTaskField(surgeryCase.task, item.completedField);
            return (
              <div
                key={item.key}
                title={`${item.label}${isCompleted ? ' (completed)' : ' (pending)'}`}
                className={`relative ${isDashboard ? 'w-5 h-5' : 'w-4 h-4'} ${isCompleted ? 'opacity-30' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    width: isDashboard ? '20px' : '16px',
                    height: isDashboard ? '20px' : '16px',
                    transform: `scale(${isDashboard ? 20 / 24 : 16 / 24})`,
                    transformOrigin: 'center',
                  }}
                >
                  <WorkflowIcon type={item.workflowType} />
                </span>
                {isCompleted && (
                  <CheckCircle2
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-green-500"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Edit button (non-dashboard) */}
        {!isDashboard && onEditClick && (
          <button
            className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={e => { e.stopPropagation(); onEditClick(surgeryCase); }}
            title="Edit case"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className={`border-t border-border ${isDashboard ? 'p-4' : 'p-3'} space-y-3`}>
          {/* Tasks */}
          {selectedTasks.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks</div>
              <div className="flex flex-wrap gap-2">
                {selectedTasks.map(item => {
                  const isCompleted = getTaskField(surgeryCase.task, item.completedField);
                  const isPending =
                    updateTaskCompletion.isPending &&
                    updateTaskCompletion.variables?.id === surgeryCase.id &&
                    updateTaskCompletion.variables?.taskType === TASK_KEY_TO_TYPE[item.key];

                  return (
                    <button
                      key={item.key}
                      onClick={e => {
                        e.stopPropagation();
                        handleTaskClick(item.key);
                      }}
                      disabled={isPending}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-all ${
                        isCompleted
                          ? 'bg-muted/50 border-border text-muted-foreground line-through opacity-60'
                          : `${getTaskBackgroundColor(item.color)} border-transparent text-foreground`
                      } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                      title={isCompleted ? `Mark ${item.label} as incomplete` : `Mark ${item.label} as complete`}
                    >
                      {isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            width: '12px',
                            height: '12px',
                            transform: 'scale(0.5)',
                            transformOrigin: 'center',
                            opacity: isCompleted ? 0.5 : 1,
                          }}
                        >
                          <WorkflowIcon type={item.workflowType} />
                        </span>
                      )}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {surgeryCase.notes && surgeryCase.notes.trim() && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</div>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{surgeryCase.notes}</p>
            </div>
          )}

          {/* Breed */}
          {surgeryCase.breed && surgeryCase.breed.trim() && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Breed:</span> {surgeryCase.breed}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
