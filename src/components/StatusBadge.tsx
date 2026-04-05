import type { ServiceRequestStatus } from "../types";
import { getStatusColor, getStatusLabel } from "../utilities/mockData";

interface StatusBadgeProps {
  status: ServiceRequestStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
};
