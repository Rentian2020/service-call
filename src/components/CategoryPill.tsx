import type { ServiceCategory } from "../types";

interface CategoryPillProps {
  category: ServiceCategory;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export const CategoryPill = ({ category, isSelected, onClick }: CategoryPillProps) => (
  <button
    onClick={() => onClick(category.id)}
    className={`flex flex-col items-center gap-2 pt-3 pb-2 px-4 rounded-2xl text-xs font-semibold transition-all active:scale-95 min-w-[72px] ${
      isSelected
        ? "bg-blue-500 text-white shadow-md shadow-blue-200"
        : "bg-white text-gray-600 border border-gray-100 shadow-sm"
    }`}
  >
    <span className="text-2xl leading-none">{category.icon}</span>
    <span className="leading-none">{category.name}</span>
  </button>
);
