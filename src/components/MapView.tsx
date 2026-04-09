import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency } from "../utilities/mockData";
import type { ServiceProvider } from "../types";

const GOOGLE_MAPS_API = import.meta.env.VITE_GOOGLE_MAPS_API;

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Minimal Google Maps types
interface GMapInstance {
  panTo: (latLng: { lat: number; lng: number }) => void;
}
interface GMapMarker {
  map: GMapInstance | null;
  addListener: (event: string, cb: () => void) => void;
}

export const MapView = () => {
  const navigate = useNavigate();
  const { providers, userLat, userLng, location } = useAppContext();
  const { user } = useAuth();
  const [selected, setSelected] = useState<ServiceProvider | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GMapInstance | null>(null);
  const markersRef = useRef<GMapMarker[]>([]);
  const userMarkerRef = useRef<GMapMarker | null>(null);

  const showDistance = user !== null;

  const providersWithDistance = providers
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      ...p,
      dist: calcDistance(userLat, userLng, p.latitude!, p.longitude!),
    }))
    .filter((p) => !filter || p.category === filter || (p.categories && p.categories.includes(filter)))
    .sort((a, b) => a.dist - b.dist);

  const serviceAreaProviders = providers
    .filter((p) => !p.latitude || !p.longitude)
    .filter((p) => !filter || p.category === filter || (p.categories && p.categories.includes(filter)));

  const categories = Array.from(
    new Set(providers.flatMap((p) => (p.categories && p.categories.length > 0 ? p.categories : [p.category])))
  );

  const initMap = useCallback(() => {
    if (!mapRef.current || !(window as any).google) return;
    try {
      const g = (window as any).google;
      const map = new g.maps.Map(mapRef.current, {
        center: { lat: userLat, lng: userLng },
        zoom: 12,
        mapId: "servicecall_map",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      googleMapRef.current = map;
      setMapLoaded(true);
    } catch {
      setMapError(true);
    }
  }, [userLat, userLng]);

  // Load Google Maps script once
  useEffect(() => {
    if (!GOOGLE_MAPS_API) { setMapError(true); return; }
    const g = (window as any).google;
    if (g?.maps) { initMap(); return; }

    (window as any).initGoogleMap = () => { initMap(); };
    if (document.querySelector("#gmap-script")) return;
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API}&libraries=marker&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);
    return () => { (window as any).initGoogleMap = undefined; };
  }, [initMap]);

  // Place markers when map or data changes
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    const g = (window as any).google;
    if (!g?.maps) return;
    const map = googleMapRef.current;

    markersRef.current.forEach((m) => { m.map = null; });
    markersRef.current = [];
    if (userMarkerRef.current) userMarkerRef.current.map = null;

    // User marker
    try {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;color:white;">★</div>`;
      const um = new g.maps.marker.AdvancedMarkerElement({ map, position: { lat: userLat, lng: userLng }, title: "You", content: el });
      userMarkerRef.current = um;
    } catch { /* fallback for older maps */ }

    // Provider markers
    providersWithDistance.forEach((p) => {
      try {
        const isSel = selected?.id === p.id;
        const el = document.createElement("div");
        const size = isSel ? 44 : 36;
        const color = p.available ? (isSel ? "#2563eb" : "#3b82f6") : "#94a3b8";
        el.innerHTML = `
          <div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;transition:all 0.2s;">
            <span style="transform:rotate(45deg);color:white;font-size:${isSel?13:10}px;font-weight:700;">${p.available?"✓":"·"}</span>
          </div>`;
        el.style.cursor = "pointer";
        const marker = new g.maps.marker.AdvancedMarkerElement({
          map, position: { lat: p.latitude!, lng: p.longitude! }, title: p.businessName || p.name, content: el,
        });
        marker.addListener("click", () => {
          setSelected((prev) => prev?.id === p.id ? null : p);
          (map as any).panTo({ lat: p.latitude!, lng: p.longitude! });
        });
        markersRef.current.push(marker);
      } catch { /* ignore */ }
    });
  }, [mapLoaded, providersWithDistance, selected, userLat, userLng]);

  // Pan on user location change
  useEffect(() => {
    if (googleMapRef.current && mapLoaded) {
      (googleMapRef.current as any).panTo({ lat: userLat, lng: userLng });
    }
  }, [userLat, userLng, mapLoaded]);

  // SVG fallback
  const renderFallbackMap = () => {
    const all = providersWithDistance;
    const allLats = [userLat, ...all.map((p) => p.latitude!)];
    const allLngs = [userLng, ...all.map((p) => p.longitude!)];
    const minLat = Math.min(...allLats) - 0.02;
    const maxLat = Math.max(...allLats) + 0.02;
    const minLng = Math.min(...allLngs) - 0.02;
    const maxLng = Math.max(...allLngs) + 0.02;
    const latR = maxLat - minLat || 0.06;
    const lngR = maxLng - minLng || 0.06;
    const W = 390; const H = 300;
    const toX = (lng: number) => ((lng - minLng) / lngR) * W;
    const toY = (lat: number) => ((maxLat - lat) / latR) * H;
    return (
      <div className="relative overflow-hidden border-b border-gray-200" style={{ height: H }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="mapbg" cx="50%" cy="50%"><stop offset="0%" stopColor="#e8f0fe"/><stop offset="100%" stopColor="#dde8f5"/></radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#mapbg)"/>
          {[0.2,0.4,0.6,0.8].map((f) => (
            <g key={f}>
              <line x1={f*W} y1={0} x2={f*W} y2={H} stroke="#c7d7ee" strokeWidth={1}/>
              <line x1={0} y1={f*H} x2={W} y2={f*H} stroke="#c7d7ee" strokeWidth={1}/>
            </g>
          ))}
          {[0.28,0.52].map((r,i) => (
            <circle key={i} cx={toX(userLng)} cy={toY(userLat)} r={r*Math.min(W,H)} fill="none" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 4" opacity={0.2}/>
          ))}
          {all.map((p) => {
            const px = toX(p.longitude!), py = toY(p.latitude!);
            const isSel = selected?.id === p.id;
            return (
              <g key={p.id} onClick={() => setSelected(isSel ? null : p)} style={{cursor:"pointer"}}>
                <ellipse cx={px} cy={py+13} rx={isSel?8:6} ry={3} fill="rgba(0,0,0,0.1)"/>
                <circle cx={px} cy={py} r={isSel?14:10} fill={isSel?"#2563eb":(p.available?"#3b82f6":"#94a3b8")}/>
                {isSel && <circle cx={px} cy={py} r={19} fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.35}/>}
                <text x={px} y={py+4} textAnchor="middle" fontSize={isSel?11:9} fill="white" fontWeight="bold">{p.available?"✓":"·"}</text>
                {isSel && <text x={px} y={py-22} textAnchor="middle" fontSize={9} fill="#1e40af" fontWeight="700">{(p.businessName||p.name).split(" ").slice(0,2).join(" ")}</text>}
              </g>
            );
          })}
          <circle cx={toX(userLng)} cy={toY(userLat)} r={16} fill="#10b981" opacity={0.18}/>
          <circle cx={toX(userLng)} cy={toY(userLat)} r={10} fill="#10b981"/>
          <text x={toX(userLng)} y={toY(userLat)+4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">★</text>
        </svg>
        <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>You</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"/>Available</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>Busy</div>
        </div>
        {!GOOGLE_MAPS_API && (
          <div className="absolute top-3 left-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <p className="text-[10px] font-bold text-amber-600">⚠ Preview map — add VITE_GOOGLE_MAPS_API for real maps</p>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
          <p className="text-xs font-bold text-gray-700">{all.length} on map</p>
        </div>
      </div>
    );
  };

  return (
    <div className="page-scroll">
      {/* Header */}
      <div className="bg-white safe-top px-4 pb-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-gray-900">Map View</h1>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              <span className="truncate">{location}</span>
            </div>
          </div>
          {!showDistance && (
            <button onClick={() => navigate("/account")} className="text-xs font-bold text-blue-500 px-3 py-1.5 bg-blue-50 rounded-xl active:bg-blue-100 transition-colors">
              Sign in
            </button>
          )}
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <button onClick={() => setFilter(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${!filter?"bg-blue-500 text-white":"bg-gray-100 text-gray-600"}`}>
              All
            </button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat === filter ? null : cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter===cat?"bg-blue-500 text-white":"bg-gray-100 text-gray-600"}`}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      {GOOGLE_MAPS_API && !mapError ? (
        <div className="relative border-b border-gray-200" style={{ height: 300 }}>
          <div ref={mapRef} className="w-full h-full"/>
          {!mapLoaded && (
            <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-[3px] border-blue-400 border-t-transparent rounded-full animate-spin"/>
                <p className="text-xs text-gray-500 font-semibold">Loading map…</p>
              </div>
            </div>
          )}
          {mapLoaded && (
            <>
              <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm pointer-events-none">
                <div className="flex items-center gap-1.5 text-xs text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>You</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"/>Available</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400"><div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>Busy</div>
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm pointer-events-none">
                <p className="text-xs font-bold text-gray-700">{providersWithDistance.length} on map</p>
              </div>
            </>
          )}
        </div>
      ) : renderFallbackMap()}

      {/* Selected Provider Card */}
      {selected && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-blue-200 p-4 animate-scale-in">
          <div className="flex items-center gap-3 mb-3">
            <img src={selected.imageUrl} alt={selected.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-gray-900 text-sm truncate">{selected.businessName || selected.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{selected.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-blue-500 font-black text-sm">{formatCurrency(selected.inspectionFee)}</p>
              <p className="text-[10px] text-gray-400">inspection</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              {selected.rating.toFixed(1)} ({selected.reviewCount})
            </div>
            {showDistance && selected.latitude && selected.longitude && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                📍 {calcDistance(userLat, userLng, selected.latitude, selected.longitude).toFixed(1)} mi away
              </span>
            )}
            <div className="ml-auto flex items-center gap-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${selected.available?"bg-emerald-400":"bg-gray-300"}`}/>
              <span className={selected.available?"text-emerald-600 font-semibold":"text-gray-400"}>
                {selected.available ? "Available" : "Busy"}
              </span>
            </div>
          </div>
          <button onClick={() => navigate(`/provider/${selected.id}`)}
            className="w-full bg-blue-500 text-white font-black py-3 rounded-xl text-sm active:scale-[0.98] transition-transform shadow-sm shadow-blue-200">
            View Profile →
          </button>
        </div>
      )}

      {/* List */}
      <div className="px-4 pt-4 space-y-2 pb-4">
        {providersWithDistance.length > 0 && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>
              {providersWithDistance.length} with exact location
              {showDistance && <span className="normal-case font-normal text-gray-400 ml-1">· sorted by distance</span>}
            </p>
            {providersWithDistance.map((p) => (
              <div key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
                className={`card-press hover-lift bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border transition-all ${selected?.id === p.id ? "border-blue-300 bg-blue-50/40" : "border-gray-100"}`}>
                <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{p.businessName || p.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-blue-500 font-black text-sm">{formatCurrency(p.inspectionFee)}</span>
                  {showDistance && <span className="text-xs text-gray-400">{p.dist.toFixed(1)} mi</span>}
                </div>
              </div>
            ))}
          </>
        )}

        {serviceAreaProviders.length > 0 && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mt-4">
              <span className="w-2 h-2 rounded-full bg-violet-400 inline-block"/>
              {serviceAreaProviders.length} service-area businesses
              <span className="normal-case font-normal text-gray-400 ml-1">· mobile / no fixed address</span>
            </p>
            {serviceAreaProviders.map((p) => (
              <div key={p.id} onClick={() => navigate(`/provider/${p.id}`)}
                className="card-press hover-lift bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-gray-100">
                <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{p.businessName || p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                    {p.location && <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full">📍 {p.location}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-blue-500 font-black text-sm">{formatCurrency(p.inspectionFee)}</span>
                  <span className="text-[10px] text-violet-400">area-based</span>
                </div>
              </div>
            ))}
          </>
        )}

        {providersWithDistance.length === 0 && serviceAreaProviders.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <p className="text-3xl mb-2">📍</p>
            <p className="text-sm font-semibold text-gray-500">No businesses found</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing the category filter, or create the first listing!</p>
          </div>
        )}
      </div>
    </div>
  );
};
