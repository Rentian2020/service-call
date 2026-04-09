import { getStatusLabel, getStatusColor } from "../utilities/mockData";
import type { ServiceRequestStatus } from "../types";

interface StatusBadgeProps {
  status: ServiceRequestStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-black"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
};
