import type { ServiceCategory } from "../types";

interface CategoryPillProps {
  category: ServiceCategory;
  isSelected?: boolean;
  onClick: (id: string) => void;
}

export const CategoryPill = ({ category, isSelected = false, onClick }: CategoryPillProps) => {
  return (
    <button
      onClick={() => onClick(category.id)}
      className={`flex flex-col items-center gap-1.5 transition-all ${isSelected ? "scale-105" : ""}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-colors ${
          isSelected
            ? "bg-blue-500 shadow-blue-200 shadow-md"
            : "bg-white border border-gray-100"
        }`}
      >
        {category.icon}
      </div>
      <span className={`text-[11px] font-medium ${isSelected ? "text-blue-500" : "text-gray-600"}`}>
        {category.name}
      </span>
    </button>
  );
};
