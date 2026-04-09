import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { PromoBanner } from "./PromoBanner";
import { CategoryPill } from "./CategoryPill";
import { ProviderCard } from "./ProviderCard";
import { NotificationsPanel } from "./NotificationsPanel";
import { LocationModal } from "./LocationModal";
import { MOCK_CATEGORIES } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import type { ServiceProvider } from "../types";

const calcDist = (lat: number | undefined, lng: number | undefined, userLat: number, userLng: number) => {
  if (!lat || !lng) return null;
  const dLat = ((lat - userLat) * Math.PI) / 180;
  const dLng = ((lng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    bookmarked, toggleBookmark, location, unreadCount,
    providers, userLat, userLng, locationDetecting,
  } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const hasLocation = userLat !== 40.7128 || userLng !== -74.006 || location !== "New York, NY";
  const showDistance = user !== null;

  const filteredProviders = providers.filter((p) => {
    const matchesCategory = !selectedCategory ||
      p.category === selectedCategory ||
      (p.categories && p.categories.includes(selectedCategory));
    const matchesSearch =
      !searchQuery ||
      (p.businessName || p.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularProviders = [...filteredProviders]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  const nearbyProviders = showDistance
    ? [...providers]
        .map((p) => ({ ...p, _dist: calcDist(p.latitude, p.longitude, userLat, userLng) }))
        .filter((p) => p._dist !== null && p._dist < 10)
        .sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999))
        .slice(0, 6)
    : [];

  const handleProviderClick = (provider: ServiceProvider) => navigate(`/provider/${provider.id}`);

  return (
    <div className="page-scroll">
      {/* Header */}
      <div className="bg-white px-5 safe-top pb-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 font-medium">
                {user ? `Hi, ${user.displayName?.split(" ")[0] ?? "there"} 👋` : "Good day 👋"}
              </p>
              <button
                onClick={() => setShowLocation(true)}
                className="flex items-center gap-1 text-sm font-bold text-gray-800 active:opacity-70 transition-opacity"
              >
                {locationDetecting ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                )}
                <span className="max-w-[150px] truncate">{location}</span>
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/map")}
              className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center active:bg-gray-100 transition-colors"
              aria-label="Map view"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
              </svg>
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center active:bg-gray-100 transition-colors"
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
        </div>
        <SearchBar onSearch={setSearchQuery} />
      </div>

      <div className="px-4 pt-4 space-y-6">
        <PromoBanner />

        {/* Role CTAs */}
        <div className="grid grid-cols-2 gap-3">
          {/* Customer CTA */}
          <button
            onClick={() => navigate("/request")}
            className="card-press bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-left shadow-lg shadow-blue-200/60"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <span className="text-lg">🛠️</span>
            </div>
            <p className="text-white font-bold text-sm leading-tight">Need a Service?</p>
            <p className="text-blue-100 text-xs mt-0.5">Book in minutes</p>
          </button>

          {/* Business CTA */}
          <button
            onClick={() => navigate("/business")}
            className="card-press bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-left shadow-lg shadow-purple-200/60"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <span className="text-lg">🏢</span>
            </div>
            <p className="text-white font-bold text-sm leading-tight">Own a Business?</p>
            <p className="text-purple-100 text-xs mt-0.5">List & get hired</p>
          </button>
        </div>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Categories</h2>
            <button onClick={() => navigate("/discover")} className="text-xs font-semibold text-blue-500">See All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {MOCK_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex-shrink-0">
                <CategoryPill
                  category={cat}
                  isSelected={selectedCategory === cat.id}
                  onClick={(id) => setSelectedCategory((prev) => (prev === id ? null : id))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Top Rated */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Top Rated</h2>
            <button onClick={() => navigate("/discover")} className="text-xs font-semibold text-blue-500">See All</button>
          </div>
          {popularProviders.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm font-semibold text-gray-500">No businesses listed yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to list your business!</p>
              <button
                onClick={() => navigate("/business")}
                className="mt-4 bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
              >
                Create Listing
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {popularProviders.map((provider) => (
                <div key={provider.id} className="flex-shrink-0 w-48">
                  <ProviderCard
                    provider={provider}
                    isBookmarked={bookmarked.has(provider.id)}
                    onBookmark={toggleBookmark}
                    onClick={handleProviderClick}
                    compact
                    showDistance={showDistance}
                    userLat={userLat}
                    userLng={userLng}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Near You (only when signed in) */}
        {showDistance && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Near You</h2>
              <button onClick={() => navigate("/map")} className="text-xs font-semibold text-blue-500">Map View</button>
            </div>
            {nearbyProviders.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
                <p className="text-2xl mb-2">📍</p>
                <p className="text-sm text-gray-400">
                  {hasLocation ? "No businesses within 10 miles" : "Update your location to see nearby businesses"}
                </p>
                <button
                  onClick={() => setShowLocation(true)}
                  className="mt-3 text-xs font-semibold text-blue-500"
                >
                  Set Location
                </button>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {nearbyProviders.map((provider) => (
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
          </section>
        )}

        {/* Sign-in nudge for guests */}
        {!user && (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">✨</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Unlock more features</p>
              <p className="text-gray-400 text-xs">Sign in to see nearby pros & track jobs</p>
            </div>
            <button
              onClick={() => navigate("/account")}
              className="bg-white text-gray-900 font-bold text-xs px-4 py-2 rounded-xl flex-shrink-0"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="h-2" />
      </div>

      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {showLocation && <LocationModal onClose={() => setShowLocation(false)} />}
    </div>
  );
};
