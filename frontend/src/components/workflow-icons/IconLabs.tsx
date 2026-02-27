import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconLabsProps {
  isCompleted?: boolean;
}

export default function IconLabs({ isCompleted = false }: IconLabsProps) {
  const color = workflowColors.labs;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      <path d="M9 3h6v11l3.5 6H5.5L9 14V3z" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </WorkflowIconBase>
  );
}
