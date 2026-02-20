import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { CompletedTasks } from '../../../backend';
import { CHECKLIST_ITEMS } from '../checklist';

interface ChecklistEditorProps {
  checklist: CompletedTasks;
  onChange: (checklist: CompletedTasks) => void;
  disabled?: boolean;
  mode?: 'creation' | 'completion';
}

export default function ChecklistEditor({ checklist, onChange, disabled, mode = 'completion' }: ChecklistEditorProps) {
  const handleCheckboxChange = (field: keyof CompletedTasks, checked: boolean) => {
    onChange({
      ...checklist,
      [field]: checked,
    });
  };

  const isCreationMode = mode === 'creation';

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center space-x-2">
            <Checkbox
              id={`checklist-${item.key}`}
              checked={checklist[item.key]}
              onCheckedChange={(checked) => handleCheckboxChange(item.key, checked as boolean)}
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
              {isCreationMode && item.defaultChecked && (
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
