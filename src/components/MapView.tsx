import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency } from "../utilities/mockData";
import type { ServiceProvider } from "../types";

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

export const MapView = () => {
  const navigate = useNavigate();
  const { providers, userLat, userLng, location } = useAppContext();
  const { user } = useAuth();
  const [selected, setSelected] = useState<ServiceProvider | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const showDistance = user !== null;

  const providersWithDistance = providers
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      ...p,
      dist: calcDistance(userLat, userLng, p.latitude!, p.longitude!),
    }))
    .filter((p) => !filter || p.category === filter || (p.categories && p.categories.includes(filter)))
    .sort((a, b) => a.dist - b.dist);

  const categories = Array.from(new Set(providers.flatMap((p) => p.categories && p.categories.length > 0 ? p.categories : [p.category])));

  // Map bounds
  const allLats = [userLat, ...providersWithDistance.map((p) => p.latitude!)];
  const allLngs = [userLng, ...providersWithDistance.map((p) => p.longitude!)];
  const minLat = Math.min(...allLats) - 0.015;
  const maxLat = Math.max(...allLats) + 0.015;
  const minLng = Math.min(...allLngs) - 0.015;
  const maxLng = Math.max(...allLngs) + 0.015;

  const latRange = maxLat - minLat || 0.05;
  const lngRange = maxLng - minLng || 0.05;

  const MAP_W = 390;
  const MAP_H = 300;

  const toX = (lng: number) => ((lng - minLng) / lngRange) * MAP_W;
  const toY = (lat: number) => ((maxLat - lat) / latRange) * MAP_H;

  return (
    <div className="page-scroll">
      {/* Header */}
      <div className="bg-white safe-top px-4 pb-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-gray-900">Map View</h1>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              <span className="truncate">{location}</span>
            </div>
          </div>
          {!showDistance && (
            <button
              onClick={() => navigate("/account")}
              className="text-xs font-bold text-blue-500 px-3 py-1.5 bg-blue-50 rounded-xl"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setFilter(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${!filter ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat === filter ? null : cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === cat ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SVG Map */}
      <div className="relative bg-gradient-to-br from-blue-50 to-slate-100 overflow-hidden border-b border-gray-200" style={{ height: MAP_H }}>
        <svg
          width="100%"
          height={MAP_H}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background */}
          <rect width={MAP_W} height={MAP_H} fill="#f0f7ff" />

          {/* Grid */}
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <g key={f}>
              <line x1={f * MAP_W} y1={0} x2={f * MAP_W} y2={MAP_H} stroke="#dbeafe" strokeWidth={1} />
              <line x1={0} y1={f * MAP_H} x2={MAP_W} y2={f * MAP_H} stroke="#dbeafe" strokeWidth={1} />
            </g>
          ))}

          {/* Distance rings */}
          {[0.28, 0.52].map((r, i) => (
            <circle
              key={i}
              cx={toX(userLng)}
              cy={toY(userLat)}
              r={r * Math.min(MAP_W, MAP_H)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="5 4"
              opacity={0.2}
            />
          ))}

          {/* Provider pins */}
          {providersWithDistance.map((p) => {
            const px = toX(p.longitude!);
            const py = toY(p.latitude!);
            const isSel = selected?.id === p.id;
            return (
              <g
                key={p.id}
                onClick={() => setSelected(isSel ? null : p)}
                style={{ cursor: "pointer" }}
              >
                {/* Shadow */}
                <ellipse cx={px} cy={py + (isSel ? 16 : 12) + 2} rx={isSel ? 8 : 6} ry={3} fill="rgba(0,0,0,0.15)" />
                {/* Pin body */}
                <circle cx={px} cy={py} r={isSel ? 14 : 10} fill={isSel ? "#2563eb" : (p.available ? "#3b82f6" : "#94a3b8")} />
                {isSel && <circle cx={px} cy={py} r={18} fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.4} />}
                <text x={px} y={py + 4} textAnchor="middle" fontSize={isSel ? 11 : 9} fill="white" fontWeight="bold">
                  {p.available ? "✓" : "·"}
                </text>
                {/* Label on select */}
                {isSel && (
                  <text x={px} y={py - 22} textAnchor="middle" fontSize={9} fill="#1e40af" fontWeight="700">
                    {(p.businessName || p.name).split(" ").slice(0, 2).join(" ")}
                  </text>
                )}
              </g>
            );
          })}

          {/* User location */}
          <g>
            <circle cx={toX(userLng)} cy={toY(userLat)} r={18} fill="#10b981" opacity={0.15} />
            <circle cx={toX(userLng)} cy={toY(userLat)} r={10} fill="#10b981" />
            <text x={toX(userLng)} y={toY(userLat) + 4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
              ★
            </text>
          </g>
        </svg>

        {/* Map Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            You
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            Business
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            Busy
          </div>
        </div>

        {/* Count badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
          <p className="text-xs font-bold text-gray-700">{providersWithDistance.length} shown</p>
        </div>

        {/* Empty state overlay */}
        {providersWithDistance.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 rounded-2xl px-6 py-5 text-center shadow-sm mx-6">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="font-bold text-gray-700 text-sm">No businesses on map yet</p>
              <p className="text-xs text-gray-400 mt-1">Businesses need a location set to appear here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Provider Card */}
      {selected && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm border border-blue-200 bg-blue-50/30 p-4 animate-scale-in">
          <div className="flex items-center gap-3 mb-3">
            <img src={selected.imageUrl} alt={selected.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-gray-900 text-sm truncate">{selected.businessName || selected.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{selected.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-blue-500 font-black text-sm">{formatCurrency(selected.inspectionFee)}</p>
              <p className="text-[10px] text-gray-400">inspection</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {selected.rating.toFixed(1)} ({selected.reviewCount})
            </div>
            {showDistance && selected.latitude && selected.longitude && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                {calcDistance(userLat, userLng, selected.latitude, selected.longitude).toFixed(1)} mi away
              </div>
            )}
            <div className="ml-auto flex items-center gap-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${selected.available ? "bg-emerald-400" : "bg-gray-300"}`} />
              <span className={selected.available ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                {selected.available ? "Available" : "Busy"}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/provider/${selected.id}`)}
            className="w-full bg-blue-500 text-white font-black py-3 rounded-xl text-sm active:scale-[0.98] transition-transform shadow-sm shadow-blue-200"
          >
            View Profile →
          </button>
        </div>
      )}

      {/* Provider List */}
      <div className="px-4 pt-4 space-y-2 pb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          {providersWithDistance.length} {filter || "all"} businesses
        </p>
        {providersWithDistance.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <p className="text-3xl mb-2">📍</p>
            <p className="text-sm font-semibold text-gray-500">No businesses with location data</p>
            <p className="text-xs text-gray-400 mt-1">Businesses need GPS set on their profile.</p>
          </div>
        ) : (
          providersWithDistance.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={`card-press bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border transition-all ${
                selected?.id === p.id ? "border-blue-300 bg-blue-50/40" : "border-gray-100"
              }`}
            >
              <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{p.businessName || p.name}</p>
                <p className="text-xs text-gray-400 capitalize">{p.category}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="text-blue-500 font-black text-sm">{formatCurrency(p.inspectionFee)}</span>
                {showDistance && (
                  <span className="text-xs text-gray-400">{p.dist.toFixed(1)} mi</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
