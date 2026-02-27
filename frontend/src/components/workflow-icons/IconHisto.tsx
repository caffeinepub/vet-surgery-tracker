import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconHistoProps {
  isCompleted?: boolean;
}

export default function IconHisto({ isCompleted = false }: IconHistoProps) {
  const color = workflowColors.histo;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      {/* Eyepiece tube at top */}
      <rect x="10" y="2" width="4" height="5" rx="0.5" />
      {/* Arm connecting eyepiece to body */}
      <path d="M12 7 L12 10" />
      {/* Main body / nosepiece area */}
      <path d="M8 10 L16 10 L15 16 L9 16 Z" />
      {/* Stage platform */}
      <rect x="6" y="16" width="12" height="2" rx="0.5" />
      {/* Base */}
      <path d="M7 18 L5 22 L19 22 L17 18 Z" />
      {/* Objective lens */}
      <line x1="12" y1="16" x2="12" y2="19" />
    </WorkflowIconBase>
  );
}
