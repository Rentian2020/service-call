import { useParams, useNavigate } from "react-router-dom";
import { MOCK_PROVIDERS, formatCurrency } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";

export const ProviderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useAppContext();

  const provider = MOCK_PROVIDERS.find((p) => p.id === id);

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Provider not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-blue-500 text-sm">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const bookmarked = isBookmarked(provider.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Hero image */}
      <div className="relative h-72 bg-gray-200">
        <img
          src={provider.imageUrl}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-5 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
          aria-label="Go back"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Bookmark */}
        <button
          onClick={() => toggleBookmark(provider.id)}
          className="absolute top-12 right-5 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
          aria-label={bookmarked ? "Remove bookmark" : "Save provider"}
        >
          <svg
            className={`w-5 h-5 ${bookmarked ? "text-blue-500 fill-blue-500" : "text-gray-700"}`}
            viewBox="0 0 24 24"
            fill={bookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Content card */}
      <div className="bg-white rounded-3xl -mt-6 relative z-10 px-5 pt-6 pb-6 mx-3 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{provider.name}</h1>
            <p className="text-sm text-gray-500 capitalize mt-0.5">{provider.category} Specialist</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-blue-500 font-bold text-lg">{formatCurrency(provider.hourlyRate)}</span>
            <span className="text-xs text-gray-400">per hour</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 py-4 border-y border-gray-50">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-gray-900 text-sm">{provider.rating}</span>
            <span className="text-xs text-gray-400">({provider.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-sm text-gray-600">{provider.distanceMiles} miles away</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className={`w-2 h-2 rounded-full ${provider.available ? "bg-emerald-400" : "bg-gray-300"}`} />
            <span className="text-sm font-medium text-gray-600">{provider.available ? "Available" : "Busy"}</span>
          </div>
        </div>

        {/* Location */}
        <div className="py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Service Area</h3>
          <p className="text-sm text-gray-500">{provider.location}</p>
        </div>

        {/* Specialties */}
        <div className="py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {provider.specialties.map((spec) => (
              <span
                key={spec}
                className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Book button */}
      <div className="fixed bottom-20 left-0 right-0 px-5 max-w-lg mx-auto">
        <button
          onClick={() => navigate("/request", { state: { providerId: provider.id } })}
          className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 text-sm transition-transform active:scale-[0.98]"
        >
          Book {provider.name}
        </button>
      </div>
    </div>
  );
};
