import type { Checklist } from '../../../backend';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CHECKLIST_ITEMS } from '../checklist';

interface ChecklistEditorProps {
  value: Checklist;
  onChange: (checklist: Checklist) => void;
  disabled?: boolean;
}

export default function ChecklistEditor({ value, onChange, disabled }: ChecklistEditorProps) {
  const handleToggle = (key: keyof Checklist) => {
    onChange({
      ...value,
      [key]: !value[key],
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-blue-200 dark:border-gray-700 p-4 bg-blue-50/50 dark:bg-gray-800/50">
      {CHECKLIST_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center space-x-2">
          <Checkbox
            id={item.key}
            checked={value[item.key]}
            onCheckedChange={() => handleToggle(item.key)}
            disabled={disabled}
          />
          <Label
            htmlFor={item.key}
            className="text-sm font-normal cursor-pointer text-blue-900 dark:text-blue-100"
          >
            {item.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
