import React from 'react';
import { iconSize, strokeWidth } from './workflowTokens';

interface WorkflowIconBaseProps {
  color: string;
  children: React.ReactNode;
  isCompleted?: boolean;
}

export default function WorkflowIconBase({ color, children, isCompleted = false }: WorkflowIconBaseProps) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: iconSize, height: iconSize }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
      {isCompleted && (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            color: '#6B7280',
          }}
        >
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      )}
    </span>
  );
}
