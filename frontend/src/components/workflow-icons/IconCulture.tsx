import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconCultureProps {
  isCompleted?: boolean;
}

export default function IconCulture({ isCompleted = false }: IconCultureProps) {
  const color = workflowColors.culture;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      {/* Petri dish outer circle */}
      <circle cx="12" cy="13" r="9" />
      {/* Petri dish lid rim (slightly smaller arc at top) */}
      <path d="M5 10 Q12 7 19 10" />
      {/* Bacterial colonies inside */}
      <circle cx="9" cy="14" r="1.5" />
      <circle cx="14" cy="12" r="1" />
      <circle cx="13" cy="16" r="1.2" />
      <circle cx="17" cy="15" r="0.8" />
    </WorkflowIconBase>
  );
}
