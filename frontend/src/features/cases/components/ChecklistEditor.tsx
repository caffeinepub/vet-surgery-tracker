import React from 'react';
import { Task } from '../../../backend';
import { CHECKLIST_ITEMS } from '../checklist';
import WorkflowIcon from '../../../components/workflow-icons/WorkflowIcon';

interface ChecklistEditorProps {
  task: Task;
  onToggleTask: (workflowType: string) => void;
  isLoading?: boolean;
}

export default function ChecklistEditor({ task, onToggleTask, isLoading = false }: ChecklistEditorProps) {
  const selectedItems = CHECKLIST_ITEMS.filter((item) => task[item.selectedField] === true);

  if (selectedItems.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No tasks selected.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {selectedItems.map((item) => {
        const isCompleted = task[item.completedField] === true;
        return (
          <button
            key={item.workflowType}
            onClick={() => onToggleTask(item.workflowType)}
            disabled={isLoading}
            title={`${item.label}${isCompleted ? ' (completed)' : ''}`}
            className={`flex flex-col items-center gap-1 p-1.5 rounded transition-opacity ${
              isCompleted ? 'opacity-50' : 'opacity-100'
            } hover:opacity-80 disabled:cursor-not-allowed`}
          >
            <WorkflowIcon workflowType={item.workflowType} isCompleted={isCompleted} />
            <span
              className="text-xs"
              style={{
                color: item.color,
                textDecoration: isCompleted ? 'line-through' : 'none',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
