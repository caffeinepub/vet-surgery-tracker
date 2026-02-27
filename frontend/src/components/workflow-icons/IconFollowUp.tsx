import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconFollowUpProps {
  isCompleted?: boolean;
}

export default function IconFollowUp({ isCompleted = false }: IconFollowUpProps) {
  const color = workflowColors.followUp;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </WorkflowIconBase>
  );
}
