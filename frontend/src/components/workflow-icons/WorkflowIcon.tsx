import React from 'react';
import IconNotified from './IconNotified';
import IconHisto from './IconHisto';
import IconLabs from './IconLabs';
import IconCulture from './IconCulture';
import IconSurgery from './IconSurgery';
import IconImaging from './IconImaging';
import IconDischarge from './IconDischarge';
import IconFollowUp from './IconFollowUp';

type IconComponent = React.FC;

const taskTypeToIconMap: Record<string, IconComponent> = {
  pdvmNotified: IconNotified,
  histo: IconHisto,
  labs: IconLabs,
  culture: IconCulture,
  surgeryReport: IconSurgery,
  imaging: IconImaging,
  dischargeNotes: IconDischarge,
  followUp: IconFollowUp,
};

interface WorkflowIconProps {
  type: string | null | undefined;
}

export function WorkflowIcon({ type }: WorkflowIconProps) {
  if (!type) return null;
  const IconComponent = taskTypeToIconMap[type];
  if (!IconComponent) return null;
  return <IconComponent />;
}
