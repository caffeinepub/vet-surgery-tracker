import React from "react";
import IconCulture from "./IconCulture";
import IconDailySummary from "./IconDailySummary";
import IconDischarge from "./IconDischarge";
import IconFollowUp from "./IconFollowUp";
import IconHisto from "./IconHisto";
import IconImaging from "./IconImaging";
import IconLabs from "./IconLabs";
import IconNotified from "./IconNotified";
import IconSurgery from "./IconSurgery";

interface WorkflowIconProps {
  workflowType: string;
  isCompleted?: boolean;
}

export default function WorkflowIcon({
  workflowType,
  isCompleted = false,
}: WorkflowIconProps) {
  switch (workflowType) {
    case "dischargeNotes":
      return <IconDischarge isCompleted={isCompleted} />;
    case "pdvmNotified":
      return <IconNotified isCompleted={isCompleted} />;
    case "labs":
      return <IconLabs isCompleted={isCompleted} />;
    case "histo":
      return <IconHisto isCompleted={isCompleted} />;
    case "surgeryReport":
      return <IconSurgery isCompleted={isCompleted} />;
    case "imaging":
      return <IconImaging isCompleted={isCompleted} />;
    case "culture":
      return <IconCulture isCompleted={isCompleted} />;
    case "followUp":
      return <IconFollowUp isCompleted={isCompleted} />;
    case "dailySummary":
      return <IconDailySummary isCompleted={isCompleted} />;
    default:
      return null;
  }
}
