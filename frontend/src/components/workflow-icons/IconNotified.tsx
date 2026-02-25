import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconNotified() {
  return (
    <WorkflowIconBase color={workflowColors.notified}>
      <path d="M4 5h16v10H8l-4 4V5z" />
    </WorkflowIconBase>
  );
}
