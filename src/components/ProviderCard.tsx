import { useAppContext } from "../hooks/useAppContext";
import type { ServiceProvider } from "../types";

interface ProviderCardProps {
  provider: ServiceProvider;
  isBookmarked: boolean;
  onBookmark: (id: string) => void;
  onClick: (provider: ServiceProvider) => void;
  compact?: boolean;
  showDistance?: boolean;
  userLat?: number;
  userLng?: number;
  distanceOverride?: number | null;
}

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

export const ProviderCard = ({
  provider,
  isBookmarked,
  onBookmark,
  onClick,
  compact = false,
  showDistance = false,
  userLat = 0,
  userLng = 0,
  distanceOverride,
}: ProviderCardProps) => {
  const { getProviderReviews } = useAppContext();
  const providerReviews = getProviderReviews(provider.id);
  const isUnrated = providerReviews.length === 0;

  const distance = distanceOverride !== undefined
    ? distanceOverride
    : showDistance
    ? calcDist(provider.latitude, provider.longitude, userLat, userLng)
    : null;

  const displayName = provider.businessName || provider.name;

  const providerTypeBadge = provider.providerType ? (
    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
      provider.providerType === "individual" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
    }`}>
      {provider.providerType === "individual" ? "Solo Pro" : "Business"}
    </span>
  ) : null;

  const isUnverified = provider.providerType === "individual" && provider.reviewCount < 20;

  if (compact) {
    return (
      <div
        onClick={() => onClick(provider)}
        className="card-press bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
        style={{ width: "192px" }}
      >
        <div className="relative h-28 bg-gray-100">
          <img
            src={provider.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={(e) => { e.stopPropagation(); onBookmark(provider.id); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"
          >
            <svg
              className={`w-3.5 h-3.5 ${isBookmarked ? "text-blue-500 fill-blue-500" : "text-gray-600"}`}
              viewBox="0 0 24 24"
              fill={isBookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          {!provider.available && (
            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              Busy
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <p className="text-[10px] text-gray-400 capitalize truncate">{provider.category}</p>
            {providerTypeBadge}
            {isUnverified && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-600">Unverified</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            {isUnrated ? (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Unrated</span>
            ) : (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[10px] font-bold text-gray-700">{provider.rating.toFixed(1)}</span>
              </div>
            )}
            {distance !== null && (
              <span className="text-[10px] text-gray-400">{distance.toFixed(1)} mi</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(provider)}
      className="card-press bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex gap-3 p-3"
    >
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        <img src={provider.imageUrl} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${provider.available ? "bg-emerald-400" : "bg-gray-300"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <p className="text-xs text-gray-400 capitalize">{provider.category}</p>
              {providerTypeBadge}
              {isUnverified && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-600">Unverified</span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onBookmark(provider.id); }}
            className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0"
          >
            <svg
              className={`w-3.5 h-3.5 ${isBookmarked ? "text-blue-500 fill-blue-500" : "text-gray-400"}`}
              viewBox="0 0 24 24"
              fill={isBookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          {isUnrated ? (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Unrated</span>
          ) : (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold text-gray-700">{provider.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({provider.reviewCount})</span>
            </div>
          )}
          {distance !== null && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              <span className="text-xs text-gray-400">{distance.toFixed(1)} mi</span>
            </div>
          )}
          <span className="text-xs text-gray-400 ml-auto">${provider.inspectionFee} fee</span>
        </div>
      </div>
    </div>
  );
};
