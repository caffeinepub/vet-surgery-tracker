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
      {/* Test tube - open top rim */}
      <path d="M9 2 L15 2" strokeLinecap="round" />
      {/* Test tube body - left side */}
      <line x1="9" y1="2" x2="9" y2="17" />
      {/* Test tube body - right side */}
      <line x1="15" y1="2" x2="15" y2="17" />
      {/* Rounded bottom */}
      <path d="M9 17 Q9 22 12 22 Q15 22 15 17" />
      {/* Liquid fill line */}
      <line x1="9.5" y1="15" x2="14.5" y2="15" strokeDasharray="0" />
      {/* Small bubble dots inside */}
      <circle cx="11" cy="18.5" r="0.8" fill={color} stroke="none" />
      <circle cx="13.5" cy="17.5" r="0.6" fill={color} stroke="none" />
    </WorkflowIconBase>
  );
}
