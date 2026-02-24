import { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListTodo } from 'lucide-react';
import { CHECKLIST_ITEMS } from '../checklist';

interface CasesTasksFilterProps {
  selectedTaskTypes: Set<string>;
  onTaskTypesChange: (selected: Set<string>) => void;
  showAllTasksCompleted?: boolean;
  onShowAllTasksCompletedChange?: (show: boolean) => void;
}

const STORAGE_KEY = 'casesTasksFilter';
const COMPLETED_STORAGE_KEY = 'casesShowAllTasksCompleted';

export default function CasesTasksFilter({ 
  selectedTaskTypes, 
  onTaskTypesChange,
  showAllTasksCompleted = false,
  onShowAllTasksCompletedChange
}: CasesTasksFilterProps) {
  // Load from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        onTaskTypesChange(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse stored task filter', e);
      }
    }

    const storedCompleted = sessionStorage.getItem(COMPLETED_STORAGE_KEY);
    if (storedCompleted && onShowAllTasksCompletedChange) {
      try {
        onShowAllTasksCompletedChange(JSON.parse(storedCompleted));
      } catch (e) {
        console.error('Failed to parse stored completed filter', e);
      }
    }
  }, []);

  // Save to session storage when changed
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedTaskTypes)));
  }, [selectedTaskTypes]);

  useEffect(() => {
    if (onShowAllTasksCompletedChange) {
      sessionStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(showAllTasksCompleted));
    }
  }, [showAllTasksCompleted, onShowAllTasksCompletedChange]);

  const handleToggle = (taskKey: string) => {
    const newSet = new Set(selectedTaskTypes);
    if (newSet.has(taskKey)) {
      newSet.delete(taskKey);
    } else {
      newSet.add(taskKey);
    }
    onTaskTypesChange(newSet);
  };

  const handleToggleCompleted = () => {
    if (onShowAllTasksCompletedChange) {
      onShowAllTasksCompletedChange(!showAllTasksCompleted);
    }
  };

  const handleClearAll = () => {
    onTaskTypesChange(new Set());
    if (onShowAllTasksCompletedChange) {
      onShowAllTasksCompletedChange(false);
    }
  };

  const activeFilterCount = selectedTaskTypes.size + (showAllTasksCompleted ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <ListTodo className="h-4 w-4 mr-2" />
          Tasks
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 min-w-5 flex items-center justify-center px-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filter by Tasks</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-auto py-1 px-2 text-xs"
              >
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
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {item.label}
                </Label>
              </div>
            ))}

            {onShowAllTasksCompletedChange && (
              <>
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="task-all-completed"
                      checked={showAllTasksCompleted}
                      onCheckedChange={handleToggleCompleted}
                    />
                    <Label
                      htmlFor="task-all-completed"
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      All Tasks Completed
                    </Label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
