import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../components/SearchBar";
// import { CategoryPill } from "../components/CategoryPill";
import { ProviderCard } from "../components/ProviderCard";
import { MOCK_CATEGORIES, MOCK_PROVIDERS } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";
import type { ServiceProvider } from "../types";

const SORT_OPTIONS = ["Nearest", "Top Rated", "Lowest Price", "Available Now"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export const Discover = () => {
  const navigate = useNavigate();
  const { bookmarked, toggleBookmark } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("Top Rated");
  const [searchQuery, setSearchQuery] = useState("");

  const handleProviderClick = (provider: ServiceProvider) => {
    navigate(`/provider/${provider.id}`);
  };

  const filtered = MOCK_PROVIDERS.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "Nearest": return a.distanceMiles - b.distanceMiles;
      case "Top Rated": return b.rating - a.rating;
      case "Lowest Price": return a.hourlyRate - b.hourlyRate;
      case "Available Now": return (b.available ? 1 : 0) - (a.available ? 1 : 0);
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-5 pt-12 pb-5 sticky top-0 z-40 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Discover</h1>
        <SearchBar onSearch={setSearchQuery} placeholder="Search by service or name..." />
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              !selectedCategory
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            All
          </button>
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sortBy === option
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Results */}
        <div>
          <p className="text-xs text-gray-500 mb-3">{sorted.length} providers found</p>
          <div className="space-y-3">
            {sorted.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium text-gray-500">No providers found</p>
                <p className="text-sm mt-1">Try a different search or category</p>
              </div>
            ) : (
              sorted.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isBookmarked={bookmarked.has(provider.id)}
                  onBookmark={toggleBookmark}
                  onClick={handleProviderClick}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
