import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { ProviderCard } from "./ProviderCard";
import { MOCK_CATEGORIES } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import type { ServiceProvider } from "../types";

const SORT_OPTIONS = ["Top Rated", "Nearest", "Lowest Fee", "Available Now"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const calcDist = (p: ServiceProvider, userLat: number, userLng: number) => {
  if (!p.latitude || !p.longitude) return 999;
  const dLat = ((p.latitude - userLat) * Math.PI) / 180;
  const dLng = ((p.longitude - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((p.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookmarked, toggleBookmark, providers, userLat, userLng } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("Top Rated");
  const [searchQuery, setSearchQuery] = useState("");

  const showDistance = user !== null;

  const handleProviderClick = (provider: ServiceProvider) => navigate(`/provider/${provider.id}`);

  const filtered = providers.filter((p) => {
    const matchesCategory = !selectedCategory ||
      p.category === selectedCategory ||
      (p.categories && p.categories.includes(selectedCategory));
    const matchesSearch =
      !searchQuery ||
      (p.businessName || p.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "Nearest": return calcDist(a, userLat, userLng) - calcDist(b, userLat, userLng);
      case "Top Rated": return b.rating - a.rating;
      case "Lowest Fee": return a.inspectionFee - b.inspectionFee;
      case "Available Now": return (b.available ? 1 : 0) - (a.available ? 1 : 0);
      default: return 0;
    }
  });

  return (
    <div className="page-scroll">
      {/* Sticky Header */}
      <div className="bg-white px-4 safe-top pb-3 sticky top-0 z-40 shadow-sm">
        <h1 className="text-xl font-black text-gray-900 mb-3">Explore</h1>
        <SearchBar onSearch={setSearchQuery} placeholder="Search services, businesses…" />
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              !selectedCategory ? "bg-blue-500 text-white shadow-sm shadow-blue-200" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            All
          </button>
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat.id
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-200"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              <span>{cat.icon}</span>{cat.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SORT_OPTIONS.map((option) => {
            const disabled = option === "Nearest" && !showDistance;
            return (
              <button
                key={option}
                onClick={() => !disabled && setSortBy(option)}
                disabled={disabled}
                title={disabled ? "Sign in to sort by distance" : undefined}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sortBy === option
                    ? "bg-gray-900 text-white"
                    : disabled
                    ? "bg-gray-50 text-gray-300 border border-gray-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option}
                {disabled && " 🔒"}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400">
            {sorted.length} {sorted.length === 1 ? "business" : "businesses"} found
          </p>
          {!showDistance && (
            <button
              onClick={() => navigate("/account")}
              className="text-xs font-bold text-blue-500"
            >
              Sign in for distances →
            </button>
          )}
        </div>

        {/* Results */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="font-bold text-gray-700 mb-1">No results found</h3>
            <p className="text-sm text-gray-400">
              {providers.length === 0 ? "No businesses listed yet." : "Try adjusting your search or filters."}
            </p>
            {providers.length === 0 && (
              <button
                onClick={() => navigate("/business")}
                className="mt-4 bg-violet-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                List Your Business
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-4 stagger-children">
            {sorted.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isBookmarked={bookmarked.has(provider.id)}
                onBookmark={toggleBookmark}
                onClick={handleProviderClick}
                showDistance={showDistance}
                userLat={userLat}
                userLng={userLng}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
