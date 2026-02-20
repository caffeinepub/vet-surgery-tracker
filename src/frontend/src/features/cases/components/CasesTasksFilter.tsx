import { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ListTodo } from 'lucide-react';
import { CHECKLIST_ITEMS } from '../checklist';
import type { CompletedTasks } from '../../../backend';

interface CasesTasksFilterProps {
  selectedTaskTypes: Set<keyof CompletedTasks>;
  onTaskTypesChange: (taskTypes: Set<keyof CompletedTasks>) => void;
}

const STORAGE_KEY = 'surgery-cases-task-types-filter';

export default function CasesTasksFilter({
  selectedTaskTypes,
  onTaskTypesChange,
}: CasesTasksFilterProps) {
  // Load from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as (keyof CompletedTasks)[];
        onTaskTypesChange(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse stored task types filter:', e);
      }
    }
  }, []);

  // Save to session storage when changed
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedTaskTypes)));
  }, [selectedTaskTypes]);

  const handleToggle = (taskKey: keyof CompletedTasks) => {
    const newSet = new Set(selectedTaskTypes);
    if (newSet.has(taskKey)) {
      newSet.delete(taskKey);
    } else {
      newSet.add(taskKey);
    }
    onTaskTypesChange(newSet);
  };

  const handleClear = () => {
    onTaskTypesChange(new Set());
  };

  const activeCount = selectedTaskTypes.size;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ListTodo className="h-4 w-4" />
          Tasks
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter by Remaining Tasks</h4>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-auto p-1 text-xs">
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`task-${item.key}`}
                  checked={selectedTaskTypes.has(item.key)}
                  onCheckedChange={() => handleToggle(item.key)}
                />
                <Label
                  htmlFor={`task-${item.key}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
