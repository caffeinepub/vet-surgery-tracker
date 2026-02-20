import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Checklist } from '../../../backend';

interface ChecklistEditorProps {
  checklist: Checklist;
  onChange: (checklist: Checklist) => void;
  disabled?: boolean;
}

export default function ChecklistEditor({ checklist, onChange, disabled }: ChecklistEditorProps) {
  const handleCheckboxChange = (field: keyof Checklist, checked: boolean) => {
    onChange({
      ...checklist,
      [field]: checked,
    });
  };

  const items: Array<{ key: keyof Checklist; label: string }> = [
    { key: 'dischargeNotes', label: 'Discharge Notes' },
    { key: 'labs', label: 'Labs' },
    { key: 'imaging', label: 'Imaging' },
    { key: 'histo', label: 'Histo' },
    { key: 'culture', label: 'Culture' },
    { key: 'surgeryReport', label: 'Surgery Report' },
    { key: 'pdvmNotified', label: 'PDVM Notified' },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center space-x-2">
          <Checkbox
            id={item.key}
            checked={checklist[item.key]}
            onCheckedChange={(checked) => handleCheckboxChange(item.key, checked as boolean)}
            disabled={disabled}
          />
          <Label
            htmlFor={item.key}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {item.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
