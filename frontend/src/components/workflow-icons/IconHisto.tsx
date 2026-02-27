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
      {/* Side-view microscope */}
      {/* Eyepiece (angled tube at top-left) */}
      <rect x="4" y="2" width="3" height="6" rx="0.5" transform="rotate(-15 5.5 5)" />
      {/* Arm (vertical column on right side) */}
      <rect x="13" y="4" width="3" height="12" rx="0.5" />
      {/* Body connecting arm to stage */}
      <path d="M8 10 Q10 10 13 12" strokeWidth="2" fill="none" />
      {/* Objective lens (pointing down-left from arm) */}
      <line x1="13" y1="14" x2="9" y2="17" strokeWidth="2" />
      <circle cx="8.5" cy="17.5" r="1" fill={color} stroke="none" />
      {/* Stage platform */}
      <rect x="6" y="15" width="8" height="2" rx="0.5" />
      {/* Base */}
      <rect x="5" y="20" width="12" height="2.5" rx="1" />
      {/* Pillar connecting stage to base */}
      <rect x="13" y="17" width="2.5" height="3" rx="0.5" />
    </WorkflowIconBase>
  );
}
