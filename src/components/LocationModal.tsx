import { useState, useEffect, useRef } from "react";
import { useAppContext } from "../hooks/useAppContext";

interface LocationModalProps {
  onClose: () => void;
}

const QUICK_LOCATIONS = [
  { name: "New York, NY", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { name: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { name: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { name: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { name: "Austin, TX", lat: 30.2672, lng: -97.7431 },
];

const GOOGLE_MAPS_API = import.meta.env.VITE_GOOGLE_MAPS_API;

export const LocationModal = ({ onClose }: LocationModalProps) => {
  const { location, setLocation, setUserCoords } = useAppContext();
  const [input, setInput] = useState(location === "Detecting location…" ? "" : location);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [visible, setVisible] = useState(false);
  const [inputError, setInputError] = useState("");
  const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const isValidLocation = (loc: string): boolean => {
    const trimmed = loc.trim();
    if (trimmed.length < 3) return false;
    return /[a-zA-Z]{2,}/.test(trimmed) && !/^\d+$/.test(trimmed);
  };

  // Google Maps Places autocomplete
  const fetchSuggestions = async (value: string) => {
    if (value.length < 3 || !GOOGLE_MAPS_API) { setSuggestions([]); return; }
    setSuggestionsLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(value)}&types=(cities)&key=${GOOGLE_MAPS_API}`
      );
      const data = await res.json();
      if (data.predictions) setSuggestions(data.predictions.slice(0, 5));
      else setSuggestions([]);
    } catch { setSuggestions([]); }
    setSuggestionsLoading(false);
  };

  // Geocode a place_id to get lat/lng
  const geocodePlaceId = async (placeId: string): Promise<{ lat: number; lng: number } | null> => {
    if (!GOOGLE_MAPS_API) return null;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_MAPS_API}`
      );
      const data = await res.json();
      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch { /* ignore */ }
    return null;
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setInputError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = async (suggestion: { description: string; place_id: string }) => {
    setInput(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setLocation(suggestion.description);
    // Try to get coordinates
    const coords = await geocodePlaceId(suggestion.place_id);
    if (coords) setUserCoords(coords.lat, coords.lng);
    handleClose();
  };

  const handleSave = () => {
    const trimmed = input.trim();
    if (!trimmed) { setInputError("Please enter a location."); return; }
    if (!isValidLocation(trimmed)) { setInputError("Please enter a valid city or address (e.g. Brooklyn, NY)."); return; }
    setLocation(trimmed);
    handleClose();
  };

  const handleQuickSelect = (loc: typeof QUICK_LOCATIONS[0]) => {
    setLocation(loc.name);
    setUserCoords(loc.lat, loc.lng);
    handleClose();
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setGeoError("Geolocation is not supported by your browser."); return; }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords(latitude, longitude);
        try {
          // Try Google Maps reverse geocoding first
          if (GOOGLE_MAPS_API) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API}`
            );
            const data = await res.json();
            if (data.results?.[0]) {
              const formatted = data.results[0].formatted_address;
              setLocation(formatted);
              setLocating(false);
              handleClose();
              return;
            }
          }
          // Fallback: Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const state = data.address?.state || "";
          const country = data.address?.country_code?.toUpperCase() || "";
          const label = [city, state, country].filter(Boolean).join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocation(label);
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLocating(false);
        handleClose();
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setGeoError("Permission denied. Please allow location access in your browser settings.");
        else setGeoError("Could not get your location. Try selecting a city below.");
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return (
    <>
      <div className={`sheet-overlay transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`} onClick={handleClose} />
      <div
        className={`sheet-panel transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
        style={{ transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(100%)" }}
      >
        <div className="px-5 pt-4 pb-8 safe-bottom">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">📍 Your Location</h2>
          <p className="text-sm text-gray-500 mb-5">Find nearby service professionals</p>

          {/* GPS Button */}
          <button onClick={handleGeolocate} disabled={locating}
            className="w-full flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5 mb-3 transition-all active:scale-[0.98]">
            <div className={`w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 ${locating ? "pulse-dot" : ""}`}>
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-blue-700">{locating ? "Detecting your location…" : "Use My Current Location"}</p>
              <p className="text-xs text-blue-400">Auto-detect via GPS</p>
            </div>
            {!locating && (
              <svg className="w-4 h-4 text-blue-400 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {geoError && <p className="text-xs text-red-500 mb-3 px-1">{geoError}</p>}

          {/* Manual Input with autocomplete */}
          <div className="relative mb-1">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-300 focus-within:bg-blue-50/30 transition-colors">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => input.length >= 3 && setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="City, state or ZIP code…"
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400" autoFocus />
                {suggestionsLoading && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                {input && !suggestionsLoading && (
                  <button onClick={() => { setInput(""); setSuggestions([]); }} className="text-gray-300 hover:text-gray-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button onClick={handleSave} disabled={!input.trim()}
                className={`px-5 rounded-2xl text-sm font-bold transition-all ${input.trim() ? "bg-blue-500 text-white active:scale-95" : "bg-gray-100 text-gray-400"}`}>
                Set
              </button>
            </div>
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-12 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl mt-1 overflow-hidden">
                {suggestions.map((s) => (
                  <button key={s.place_id} onMouseDown={() => handleSuggestionSelect(s)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center gap-2">
                    <span className="text-blue-400 flex-shrink-0">📍</span>
                    <span className="truncate">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {inputError && <p className="text-xs text-red-500 mb-3 px-1">{inputError}</p>}
          {!GOOGLE_MAPS_API && (
            <p className="text-xs text-amber-500 mb-3 px-1">⚠ Add VITE_GOOGLE_MAPS_API for location autocomplete.</p>
          )}

          {/* Quick Cities */}
          <div className="mt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popular Cities</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOCATIONS.map((loc) => (
                <button key={loc.name} onClick={() => handleQuickSelect(loc)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${location === loc.name ? "bg-blue-500 text-white shadow-sm shadow-blue-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {loc.name.split(",")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
