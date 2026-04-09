import { useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import type { ServiceProvider } from "../types";

export const Bookmarks = () => {
  const navigate = useNavigate();
  const { bookmarked, toggleBookmark, providers } = useAppContext();

  const savedProviders = providers.filter((p) => bookmarked.has(p.id));

  const handleClick = (p: ServiceProvider) => navigate(`/provider/${p.id}`);

  return (
    <div className="page-scroll">
      <div className="bg-white px-5 safe-top pb-4 sticky top-0 z-40 shadow-sm">
        <h1 className="text-xl font-black text-gray-900">Saved</h1>
        {savedProviders.length > 0 && (
          <p className="text-sm text-gray-400 mt-0.5">{savedProviders.length} saved {savedProviders.length === 1 ? "business" : "businesses"}</p>
        )}
      </div>

      <div className="px-4 pt-4">
        {savedProviders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔖</p>
            <h2 className="font-black text-gray-700 text-lg mb-2">Nothing saved yet</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
              Tap the bookmark icon on any business to save it for later.
            </p>
            <button
              onClick={() => navigate("/discover")}
              className="bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md shadow-blue-200"
            >
              Explore Businesses
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {savedProviders.map((p) => (
              <div
                key={p.id}
                className="card-press bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex gap-3 p-3"
                onClick={() => handleClick(p)}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${p.available ? "bg-emerald-400" : "bg-gray-300"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{p.businessName || p.name}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{p.category}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-bold text-gray-700">{p.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-400">${p.inspectionFee} fee</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(p.id); }}
                  className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center self-center flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
