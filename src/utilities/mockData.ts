import type { ServiceCategory } from "../types";

export const MOCK_CATEGORIES: ServiceCategory[] = [
  { id: "repairing", name: "Repairing", icon: "🔧" },
  { id: "electricity", name: "Electricity", icon: "⚡" },
  { id: "plumbing", name: "Plumbing", icon: "🔩" },
  { id: "cleaning", name: "Cleaning", icon: "🧹" },
  { id: "excavation", name: "Excavation", icon: "⛏️" },
  { id: "painting", name: "Painting", icon: "🖌️" },
  { id: "hvac", name: "HVAC", icon: "❄️" },
  { id: "roofing", name: "Roofing", icon: "🏠" },
  { id: "landscaping", name: "Landscaping", icon: "🌿" },
  { id: "locksmith", name: "Locksmith", icon: "🔑" },
  { id: "pest_control", name: "Pest Control", icon: "🐛" },
  { id: "appliances", name: "Appliances", icon: "🫧" },
];

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    inspection: "Inspection Scheduled",
    quote_provided: "Quote Provided",
    en_route: "En Route",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "#f59e0b",
    accepted: "#3b82f6",
    inspection: "#8b5cf6",
    quote_provided: "#f97316",
    en_route: "#06b6d4",
    in_progress: "#10b981",
    completed: "#6b7280",
    cancelled: "#ef4444",
  };
  return colors[status] ?? "#6b7280";
};
