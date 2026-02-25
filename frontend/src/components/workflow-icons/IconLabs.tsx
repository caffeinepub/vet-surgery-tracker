import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconLabs() {
  return (
    <WorkflowIconBase color={workflowColors.labs}>
      <path d="M10 3v10a4 4 0 108 0V3" />
      <line x1="10" y1="8" x2="18" y2="8" />
    </WorkflowIconBase>
  );
}
