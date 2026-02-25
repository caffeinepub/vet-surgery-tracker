import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconSurgery() {
  return (
    <WorkflowIconBase color={workflowColors.surgery}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="9" y1="15" x2="16" y2="8" />
      <line x1="15" y1="7" x2="17" y2="9" />
    </WorkflowIconBase>
  );
}
