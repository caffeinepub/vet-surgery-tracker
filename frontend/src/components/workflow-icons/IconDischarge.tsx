import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconDischargeProps {
  isCompleted?: boolean;
}

export default function IconDischarge({ isCompleted = false }: IconDischargeProps) {
  const color = workflowColors.dischargeNotes;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 13" />
    </WorkflowIconBase>
  );
}
