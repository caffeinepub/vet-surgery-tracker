import React from "react";
import { iconSize } from "./workflowTokens";

interface IconFollowUpProps {
  isCompleted?: boolean;
}

export default function IconFollowUp({
  isCompleted = false,
}: IconFollowUpProps) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        width: iconSize,
        height: iconSize,
      }}
    >
      <img
        src="/assets/uploads/circular-arrow-1.png"
        alt="Follow Up"
        width={iconSize}
        height={iconSize}
        style={{ display: "block", objectFit: "contain" }}
      />
      {isCompleted && (
        <svg
          aria-hidden="true"
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            color: "#6B7280",
          }}
        >
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      )}
    </span>
  );
}
