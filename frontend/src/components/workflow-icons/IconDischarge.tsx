import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconDischarge() {
  return (
    <WorkflowIconBase color={workflowColors.discharge}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <polyline points="8 13 11 16 16 10" />
    </WorkflowIconBase>
  );
}
