import { useNavigate } from "react-router-dom";
import { ProviderCard } from "../components/ProviderCard";
import { MOCK_PROVIDERS } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";
import type { ServiceProvider } from "../types";

export const Bookmarks = () => {
  const navigate = useNavigate();
  const { bookmarked, toggleBookmark } = useAppContext();

  const handleProviderClick = (provider: ServiceProvider) => {
    navigate(`/provider/${provider.id}`);
  };

  const savedProviders = MOCK_PROVIDERS.filter((p) => bookmarked.has(p.id));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-5 pt-12 pb-5">
        <h1 className="text-xl font-bold text-gray-900">Saved</h1>
        <p className="text-sm text-gray-500 mt-1">{savedProviders.length} providers bookmarked</p>
      </div>

      <div className="px-5 pt-4">
        {savedProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No bookmarks yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Save providers you like to find them faster</p>
            <button
              onClick={() => navigate("/discover")}
              className="bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-2xl"
            >
              Discover Providers
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {savedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isBookmarked
                onBookmark={toggleBookmark}
                onClick={handleProviderClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
