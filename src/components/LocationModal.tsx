import { useState } from "react";
import { useAppContext } from "../hooks/useAppContext";

interface LocationModalProps {
  onClose: () => void;
}

const QUICK_LOCATIONS = [
  "New York, USA",
  "Los Angeles, USA",
  "Chicago, USA",
  "Houston, USA",
  "Miami, USA",
  "San Francisco, USA",
  "Seattle, USA",
  "Austin, USA",
];

export const LocationModal = ({ onClose }: LocationModalProps) => {
  const { location, setLocation } = useAppContext();
  const [input, setInput] = useState(location);

  const handleSave = () => {
    const trimmed = input.trim();
    if (trimmed) {
      setLocation(trimmed);
      onClose();
    }
  };

  const handleQuickSelect = (loc: string) => {
    setLocation(loc);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto">
        <div className="px-5 pt-5 pb-8">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

          <h2 className="text-lg font-bold text-gray-900 mb-1">Your Location</h2>
          <p className="text-sm text-gray-500 mb-5">
            Set your location to find providers near you
          </p>

          {/* Input */}
          <div className="flex gap-2 mb-5">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="City, State or ZIP..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                autoFocus
              />
              {input && (
                <button onClick={() => setInput("")} className="text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white font-semibold text-sm px-5 rounded-2xl"
            >
              Set
            </button>
          </div>

          {/* Quick picks */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Popular Cities
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleQuickSelect(loc)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    location === loc
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {loc.split(",")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
