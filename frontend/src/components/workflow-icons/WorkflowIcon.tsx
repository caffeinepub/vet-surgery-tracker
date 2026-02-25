import IconDischarge from "./IconDischarge";
import IconNotified from "./IconNotified";
import IconLabs from "./IconLabs";
import IconHisto from "./IconHisto";
import IconImaging from "./IconImaging";
import IconSurgery from "./IconSurgery";
import IconCulture from "./IconCulture";
import IconFollowUp from "./IconFollowUp";

export type WorkflowType =
  | "discharge"
  | "notified"
  | "labs"
  | "histo"
  | "imaging"
  | "surgery"
  | "culture"
  | "followup";

export default function WorkflowIcon({ type }: { type: WorkflowType }) {
  const icons: Record<WorkflowType, React.ReactElement> = {
    discharge: <IconDischarge />,
    notified: <IconNotified />,
    labs: <IconLabs />,
    histo: <IconHisto />,
    imaging: <IconImaging />,
    surgery: <IconSurgery />,
    culture: <IconCulture />,
    followup: <IconFollowUp />,
  };

  return icons[type] ?? null;
}
