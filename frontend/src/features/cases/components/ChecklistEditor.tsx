import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Task } from '../../../backend';
import { CHECKLIST_ITEMS, getTaskBorderColor, getTaskBackgroundColor } from '../checklist';
import WorkflowIcon from '../../../components/workflow-icons/WorkflowIcon';

interface ChecklistEditorProps {
  task: Task;
  onChange: (task: Task) => void;
  disabled?: boolean;
  mode?: 'creation' | 'completion';
}

export default function ChecklistEditor({ task, onChange, disabled, mode = 'completion' }: ChecklistEditorProps) {
  const isCreationMode = mode === 'creation';

  const handleCheckboxChange = (item: typeof CHECKLIST_ITEMS[0], checked: boolean) => {
    if (isCreationMode) {
      onChange({
        ...task,
        [item.selectedField]: checked,
      });
    } else {
      onChange({
        ...task,
        [item.completedField]: checked,
      });
    }
  };

  const getCheckboxState = (item: typeof CHECKLIST_ITEMS[0]): boolean => {
    if (isCreationMode) {
      return task[item.selectedField] as boolean;
    } else {
      return task[item.completedField] as boolean;
    }
  };

  // In completion mode, only show tasks that are selected
  const itemsToDisplay = isCreationMode
    ? CHECKLIST_ITEMS
    : CHECKLIST_ITEMS.filter(item => task[item.selectedField] === true);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        {itemsToDisplay.map((item) => {
          const borderColor = getTaskBorderColor(item.color);
          const backgroundColor = getTaskBackgroundColor(item.color);
          const isChecked = getCheckboxState(item);

          return (
            <div
              key={item.key}
              className={cn(
                'flex items-center space-x-2 rounded-md p-2 -mx-2 border-2',
                borderColor,
                backgroundColor,
                !isCreationMode && isChecked ? 'opacity-60' : ''
              )}
            >
              <Checkbox
                id={`checklist-${mode}-${item.key}`}
                checked={isChecked}
                onCheckedChange={(checked) => handleCheckboxChange(item, checked as boolean)}
                disabled={disabled}
              />
              <span
                style={{
                  display: 'inline-flex',
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                  transform: 'scale(0.667)',
                  transformOrigin: 'center',
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <WorkflowIcon type={item.workflowType} />
              </span>
              <Label
                htmlFor={`checklist-${mode}-${item.key}`}
                className={cn(
                  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                  disabled && 'opacity-50 cursor-not-allowed',
                  !isCreationMode && isChecked ? 'line-through text-muted-foreground' : ''
                )}
              >
                {item.label}
                {isCreationMode && item.defaultSelected && (
                  <span className="ml-2 text-xs text-muted-foreground">(default)</span>
                )}
              </Label>
            </div>
          );
        })}
      </div>
      {isCreationMode && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          Selected tasks will appear as icons on the case card.
        </p>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
