import React from 'react';
import { iconSize } from './workflowTokens';

interface IconImagingProps {
  isCompleted?: boolean;
}

export default function IconImaging({ isCompleted = false }: IconImagingProps) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: iconSize, height: iconSize }}>
      <img
        src="/assets/generated/xray-bone-icon.dim_128x128.png"
        alt="Imaging"
        width={iconSize}
        height={iconSize}
        style={{ filter: 'grayscale(100%)', display: 'block' }}
      />
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
