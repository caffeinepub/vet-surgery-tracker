import React from 'react';
import WorkflowIconBase from './WorkflowIconBase';
import { workflowColors } from './workflowTokens';

interface IconDailySummaryProps {
  isCompleted?: boolean;
}

export default function IconDailySummary({ isCompleted = false }: IconDailySummaryProps) {
  const color = workflowColors.dailySummary;
  return (
    <WorkflowIconBase color={color} isCompleted={isCompleted}>
      {/* Tear-off calendar page: outer rectangle */}
      <rect x="3" y="4" width="18" height="18" rx="1" ry="1" />
      {/* Tear-off top strip */}
      <line x1="3" y1="9" x2="21" y2="9" />
      {/* Two binding holes at top */}
      <circle cx="8" cy="6.5" r="1" fill={color} stroke="none" />
      <circle cx="16" cy="6.5" r="1" fill={color} stroke="none" />
      {/* Two large digits "31" representing a calendar date */}
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill={color}
        stroke="none"
        fontFamily="sans-serif"
      >
        31
      </text>
    </WorkflowIconBase>
  );
}
