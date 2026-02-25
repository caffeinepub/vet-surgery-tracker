import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconCulture() {
  return (
    <WorkflowIconBase color={workflowColors.culture}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="14" cy="13" r="1" />
      <circle cx="12" cy="16" r="1" />
    </WorkflowIconBase>
  );
}
