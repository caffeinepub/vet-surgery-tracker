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
      <ellipse cx="12" cy="10" rx="8" ry="4" />
      <path d="M4 10v4c0 2.21 3.58 4 8 4s8-1.79 8-4v-4" />
    </WorkflowIconBase>
  );
}
