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
      {/* Calendar page outer rectangle */}
      <rect x="3" y="3" width="18" height="19" rx="1" ry="1" />
      {/* Tear-off top strip */}
      <line x1="3" y1="8" x2="21" y2="8" />
      {/* Binding holes at top */}
      <circle cx="8" cy="5.5" r="1" fill={color} stroke="none" />
      <circle cx="16" cy="5.5" r="1" fill={color} stroke="none" />
      {/* Calendar date lines */}
      <line x1="7" y1="13" x2="17" y2="13" />
      <line x1="7" y1="16" x2="17" y2="16" />
      <line x1="7" y1="19" x2="13" y2="19" />
    </WorkflowIconBase>
  );
}
