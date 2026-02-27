import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconSurgeryProps {
  isCompleted?: boolean;
}

export default function IconSurgery({ isCompleted = false }: IconSurgeryProps) {
  const color = workflowColors.surgeryReport;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      {/* Scalpel handle - long thin rectangle at an angle */}
      <line x1="4" y1="20" x2="16" y2="8" strokeWidth="2.5" />
      {/* Blade - triangular tip */}
      <path d="M16 8 L20 4 L19 9 Z" />
      {/* Blade edge detail */}
      <path d="M16 8 L20 4" />
      {/* Guard / bolster between handle and blade */}
      <line x1="14" y1="10" x2="17" y2="7" strokeWidth="1.5" />
    </WorkflowIconBase>
  );
}
