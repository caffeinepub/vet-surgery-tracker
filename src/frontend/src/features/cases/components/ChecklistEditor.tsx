import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Task } from '../../../backend';
import { CHECKLIST_ITEMS } from '../checklist';

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
      // In creation mode, toggle the *Selected field
      onChange({
        ...task,
        [item.selectedField]: checked,
      });
    } else {
      // In completion mode, toggle the *Completed field
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

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center space-x-2">
            <Checkbox
              id={`checklist-${item.key}`}
              checked={getCheckboxState(item)}
              onCheckedChange={(checked) => handleCheckboxChange(item, checked as boolean)}
              disabled={disabled}
            />
            <Label
              htmlFor={`checklist-${item.key}`}
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.label}
              {isCreationMode && item.defaultSelected && (
                <span className="ml-2 text-xs text-muted-foreground">(default)</span>
              )}
            </Label>
          </div>
        ))}
      </div>
      {isCreationMode && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          Selected tasks will appear as incomplete checkboxes on the case card.
        </p>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
