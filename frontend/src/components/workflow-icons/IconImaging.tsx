import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconImaging() {
  return (
    <WorkflowIconBase color={workflowColors.imaging}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <polyline points="6 15 10 11 13 13 18 8" />
    </WorkflowIconBase>
  );
}
