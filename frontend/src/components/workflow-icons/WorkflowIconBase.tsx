import React from "react";
import { iconSize, strokeWidth } from "./workflowTokens";

type Props = {
  color: string;
  children: React.ReactNode;
};

export default function WorkflowIconBase({ color, children }: Props) {
  return (
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
  );
}
