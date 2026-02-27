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
  onShowAllTasksCompletedChange,
}: CasesTasksFilterProps) {
  // Load from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        onTaskTypesChange(new Set(parsed));
      } catch (e) {
        // ignore
      }
    }

    const storedCompleted = sessionStorage.getItem(COMPLETED_STORAGE_KEY);
    if (storedCompleted && onShowAllTasksCompletedChange) {
      try {
        onShowAllTasksCompletedChange(JSON.parse(storedCompleted));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleToggle = (workflowType: string) => {
    const next = new Set(selectedTaskTypes);
    if (next.has(workflowType)) {
      next.delete(workflowType);
    } else {
      next.add(workflowType);
    }
    onTaskTypesChange(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  };

  const handleCompletedToggle = () => {
    const next = !showAllTasksCompleted;
    onShowAllTasksCompletedChange?.(next);
    sessionStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(next));
  };

  const activeCount = selectedTaskTypes.size + (showAllTasksCompleted ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <ListTodo className="h-3.5 w-3.5" />
          Tasks
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Filter by Task
          </p>
          {CHECKLIST_ITEMS.map((item) => (
            <div key={item.workflowType} className="flex items-center space-x-2">
              <Checkbox
                id={`task-${item.workflowType}`}
                checked={selectedTaskTypes.has(item.workflowType)}
                onCheckedChange={() => handleToggle(item.workflowType)}
              />
              <Label
                htmlFor={`task-${item.workflowType}`}
                className="text-sm cursor-pointer font-normal"
              >
                {item.label}
              </Label>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-completed"
                checked={showAllTasksCompleted}
                onCheckedChange={handleCompletedToggle}
              />
              <Label htmlFor="show-completed" className="text-sm cursor-pointer font-normal">
                All Tasks Completed
              </Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
