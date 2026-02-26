import React from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkflowIcon } from '../../../components/workflow-icons/WorkflowIcon';
import { CHECKLIST_ITEMS } from '../checklist';
import type { Task } from '../../../backend';

interface ChecklistEditorProps {
  task: Task;
  onToggleTask: (taskType: string) => void;
  isLoading?: boolean;
}

export function ChecklistEditor({ task, onToggleTask, isLoading }: ChecklistEditorProps) {
  // Only show items that are selected on this task
  const visibleItems = CHECKLIST_ITEMS.filter((item) => task[item.selectedField] === true);

  if (visibleItems.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleItems.map((item) => {
        const isCompleted = task[item.completedField] === true;
        return (
          <div
            key={item.key}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
              isCompleted ? 'bg-muted/50' : 'bg-muted'
            )}
          >
            <Checkbox
              id={`task-${item.key}`}
              checked={isCompleted}
              onCheckedChange={() => onToggleTask(item.workflowType)}
              disabled={isLoading}
              className="shrink-0"
            />
            <div className="shrink-0">
              <WorkflowIcon type={item.workflowType} />
            </div>
            <label
              htmlFor={`task-${item.key}`}
              className={cn(
                'text-sm cursor-pointer select-none flex-1',
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              )}
            >
              {item.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}
