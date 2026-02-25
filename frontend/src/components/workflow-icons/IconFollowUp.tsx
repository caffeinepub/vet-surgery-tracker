import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconFollowUp() {
  return (
    <WorkflowIconBase color={workflowColors.followup}>
      <path d="M20 12a8 8 0 10-3 6" />
      <polyline points="20 16 20 12 16 12" />
    </WorkflowIconBase>
  );
}
