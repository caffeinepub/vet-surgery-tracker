import WorkflowIconBase from "./WorkflowIconBase";
import { workflowColors } from "./workflowTokens";

export default function IconHisto() {
  return (
    <WorkflowIconBase color={workflowColors.histo}>
      <circle cx="10" cy="17" r="2" />
      <path d="M12 5l4 4" />
      <path d="M8 21h8" />
      <path d="M14 9a4 4 0 11-4 4" />
    </WorkflowIconBase>
  );
}
