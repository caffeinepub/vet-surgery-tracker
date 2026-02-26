import React from 'react';
import IconDischarge from './IconDischarge';
import IconNotified from './IconNotified';
import IconLabs from './IconLabs';
import IconHisto from './IconHisto';
import IconImaging from './IconImaging';
import IconSurgery from './IconSurgery';
import IconCulture from './IconCulture';
import IconFollowUp from './IconFollowUp';

export type WorkflowType =
  | 'discharge'
  | 'notified'
  | 'labs'
  | 'histo'
  | 'imaging'
  | 'surgery'
  | 'culture'
  | 'followup';

interface WorkflowIconProps {
  type: WorkflowType | string | undefined | null;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  discharge: IconDischarge,
  notified: IconNotified,
  labs: IconLabs,
  histo: IconHisto,
  imaging: IconImaging,
  surgery: IconSurgery,
  culture: IconCulture,
  followup: IconFollowUp,
};

export default function WorkflowIcon({ type, className }: WorkflowIconProps) {
  if (!type) return null;
  const IconComponent = iconMap[type];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}
