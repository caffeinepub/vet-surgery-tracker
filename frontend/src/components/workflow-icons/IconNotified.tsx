import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconNotifiedProps {
  isCompleted?: boolean;
}

export default function IconNotified({ isCompleted = false }: IconNotifiedProps) {
  const color = workflowColors.pdvmNotified;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </WorkflowIconBase>
  );
}
