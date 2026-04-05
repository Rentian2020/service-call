import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../components/SearchBar";
import { PromoBanner } from "../components/PromoBanner";
import { CategoryPill } from "../components/CategoryPill";
import { ProviderCard } from "../components/ProviderCard";
import { NotificationsPanel } from "../components/NotificationsPanel";
import { LocationModal } from "../components/LocationModal";
import { MOCK_CATEGORIES, MOCK_PROVIDERS } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";
import type { ServiceProvider } from "../types";

export const Home = () => {
  const navigate = useNavigate();
  const { bookmarked, toggleBookmark, location, unreadCount } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const handleCategorySelect = (id: string) => {
    setSelectedCategory((prev) => (prev === id ? null : id));
  };

  const handleProviderClick = (provider: ServiceProvider) => {
    navigate(`/provider/${provider.id}`);
  };

  const filteredProviders = MOCK_PROVIDERS.filter((p) => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularProviders = filteredProviders.slice(0, 4);
  const nearbyProviders = MOCK_PROVIDERS.filter((p) => p.distanceMiles < 3);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Location</p>
              <button
                onClick={() => setShowLocation(true)}
                className="flex items-center gap-1 text-sm font-semibold text-gray-800"
              >
                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="max-w-[140px] truncate">{location}</span>
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
              </span>
            )}
          </button>
        </div>

        <SearchBar onSearch={setSearchQuery} />
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Promo Banner */}
        <PromoBanner />

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">All Categories</h2>
            <button
              onClick={() => navigate("/discover")}
              className="text-xs font-semibold text-blue-500"
            >
              View All
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
            {MOCK_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex-shrink-0">
                <CategoryPill
                  category={cat}
                  isSelected={selectedCategory === cat.id}
                  onClick={handleCategorySelect}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Popular Services */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Popular Services</h2>
            <button
              onClick={() => navigate("/discover")}
              className="text-xs font-semibold text-blue-500"
            >
              View All
            </button>
          </div>

          {popularProviders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">No providers found</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
              {popularProviders.map((provider) => (
                <div key={provider.id} className="flex-shrink-0">
                  <ProviderCard
                    provider={provider}
                    isBookmarked={bookmarked.has(provider.id)}
                    onBookmark={toggleBookmark}
                    onClick={handleProviderClick}
                    compact
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Near You */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Near You</h2>
            <button
              onClick={() => navigate("/discover")}
              className="text-xs font-semibold text-blue-500"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {nearbyProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isBookmarked={bookmarked.has(provider.id)}
                onBookmark={toggleBookmark}
                onClick={handleProviderClick}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Notifications panel */}
      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}

      {/* Location modal */}
      {showLocation && (
        <LocationModal onClose={() => setShowLocation(false)} />
      )}
    </div>
  );
};
