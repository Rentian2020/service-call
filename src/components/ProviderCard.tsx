import type { ServiceProvider } from "../types";
import { formatCurrency } from "../utilities/mockData";

interface ProviderCardProps {
  provider: ServiceProvider;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
  onClick?: (provider: ServiceProvider) => void;
  compact?: boolean;
}

export const ProviderCard = ({
  provider,
  onBookmark,
  isBookmarked = false,
  onClick,
  compact = false,
}: ProviderCardProps) => {
  return (
    <div
      className={`relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-transform active:scale-[0.98] hover:shadow-md ${compact ? "w-44" : "w-full"}`}
      onClick={() => onClick?.(provider)}
    >
      <div className={`relative ${compact ? "h-32" : "h-44"} bg-gray-100`}>
        <img
          src={provider.imageUrl}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        {/* Rating badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
          <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-semibold text-gray-800">{provider.rating.toFixed(1)}</span>
        </div>
        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.(provider.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-colors"
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          <svg
            className={`w-4 h-4 ${isBookmarked ? "text-blue-500 fill-blue-500" : "text-gray-400"}`}
            viewBox="0 0 24 24"
            fill={isBookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        {/* Availability dot */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${provider.available ? "bg-emerald-400" : "bg-gray-300"}`} />
          <span className="text-[10px] font-medium text-white drop-shadow-sm">
            {provider.available ? "Available" : "Busy"}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{provider.name}</h3>
        <p className="text-xs text-gray-500 capitalize mt-0.5">{provider.category}</p>
        {!compact && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{provider.distanceMiles} mi</span>
            </div>
            <span className="text-blue-500 font-semibold text-sm">
              {formatCurrency(provider.hourlyRate)}/hr
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
