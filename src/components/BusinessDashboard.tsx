import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import { signInWithGoogle } from "../services/authService";
import { MOCK_CATEGORIES, formatCurrency, getStatusColor, getStatusLabel } from "../utilities/mockData";
import type { ServiceProvider } from "../types";

const GOOGLE_MAPS_API = import.meta.env.VITE_GOOGLE_MAPS_API;

// Phone formatter: (123) 456-7890
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const EMPTY_FORM = {
  businessName: "",
  categories: [] as string[],   // multi-category
  description: "",
  phone: "",
  website: "",
  location: "",
  inspectionFee: "",
  specialties: "",
  available: true,
  imageUrl: "",
  providerType: "business" as "individual" | "business",
};

type Tab = "listings" | "create" | "requests";

const isValidLocation = (loc: string): boolean => {
  const trimmed = loc.trim();
  if (trimmed.length < 4) return false;
  const hasCommaOrState = /,/.test(trimmed) || /\b[A-Z]{2}\b/.test(trimmed);
  const hasLetters = /[a-zA-Z]{2,}/.test(trimmed);
  const notJustNumbers = !/^\d+$/.test(trimmed);
  return hasLetters && notJustNumbers && hasCommaOrState;
};

const isValidWebsite = (url: string): boolean => {
  if (!url) return true; // optional
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/.test(url.trim());
};

// Simple localStorage-backed persistence helpers
const STORAGE_KEY = "servicecall_providers";
const loadPersistedProviders = (): ServiceProvider[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const persistProviders = (providers: ServiceProvider[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(providers)); } catch { /* ignore */ }
};

export const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { providers, addProvider, updateProvider, removeProvider, requests, updateRequest, addNotification, setLocation: setAppLocation, setUserCoords } = useAppContext();
  const [signingIn, setSigningIn] = useState(false);
  const [tab, setTab] = useState<Tab>("listings");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [quoteForms, setQuoteForms] = useState<Record<string, string>>({});
  const [locationSuggestions, setLocationSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestionsLoading, setLocationSuggestionsLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted providers on mount (for the current user)
  useEffect(() => {
    if (!user) return;
    const persisted = loadPersistedProviders().filter(p => p.ownerUid === user.uid);
    persisted.forEach(p => {
      if (!providers.find(existing => existing.id === p.id)) addProvider(p);
    });
  }, [user?.uid]);

  // Persist providers whenever they change
  useEffect(() => {
    if (providers.length > 0) persistProviders(providers);
  }, [providers]);

  const myListings = providers.filter((p) => p.ownerUid === user?.uid);
  const myRequests = requests.filter((r) => myListings.some((l) => l.id === r.providerId));

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); } catch {}
    setSigningIn(false);
  };

  const handleChange = (key: keyof typeof form, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleCategory = (catId: string) => {
    setForm((prev) => {
      const cats = prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId];
      return { ...prev, categories: cats };
    });
    setFormErrors((prev) => ({ ...prev, categories: "" }));
  };

  const handlePhoneChange = (value: string) => {
    handleChange("phone", formatPhone(value));
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setSaved(false); setFormErrors({}); setLocationSuggestions([]); };

  const handleEdit = (p: ServiceProvider) => {
    setForm({
      businessName: p.businessName ?? "",
      categories: p.categories ?? (p.category ? [p.category] : []),
      description: p.description ?? "",
      phone: p.phone ?? "",
      website: p.website ?? "",
      location: p.location,
      inspectionFee: String(p.inspectionFee),
      specialties: p.specialties.join(", "),
      available: p.available,
      imageUrl: p.imageUrl,
      providerType: p.providerType ?? "business",
    });
    setEditingId(p.id);
    setTab("create");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleDelete = (id: string) => {
    removeProvider(id);
    setConfirmDelete(null);
    // Remove from localStorage too
    const persisted = loadPersistedProviders().filter(p => p.id !== id);
    persistProviders(persisted);
  };

  // Google Maps location autocomplete
  const fetchLocationSuggestions = async (input: string) => {
    if (input.length < 3 || !GOOGLE_MAPS_API) { setLocationSuggestions([]); return; }
    setLocationSuggestionsLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${GOOGLE_MAPS_API}`
      );
      const data = await res.json();
      if (data.predictions) setLocationSuggestions(data.predictions.slice(0, 5));
      else setLocationSuggestions([]);
    } catch { setLocationSuggestions([]); }
    setLocationSuggestionsLoading(false);
  };

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

  const handleLocationInputChange = (value: string) => {
    handleChange("location", value);
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = setTimeout(() => fetchLocationSuggestions(value), 300);
    setShowLocationSuggestions(true);
  };

  const handleLocationSuggestionSelect = async (s: { description: string; place_id: string }) => {
    handleChange("location", s.description);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
    const coords = await geocodePlaceId(s.place_id);
    if (coords) {
      setForm((prev) => ({ ...prev, location: s.description, _lat: coords.lat, _lng: coords.lng } as typeof prev));
      setUserCoords(coords.lat, coords.lng);
      setAppLocation(s.description);
    }
  };

  // GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          let label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          if (GOOGLE_MAPS_API) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API}`);
            const data = await res.json();
            if (data.results?.[0]) label = data.results[0].formatted_address;
          } else {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || "";
            const state = data.address?.state || "";
            const country = data.address?.country_code?.toUpperCase() || "";
            label = [city, state, country].filter(Boolean).join(", ") || label;
          }
          setForm((prev) => ({ ...prev, location: label, _lat: latitude, _lng: longitude } as typeof prev));
          setUserCoords(latitude, longitude);
          setAppLocation(label);
          setFormErrors((prev) => ({ ...prev, location: "" }));
        } catch {
          setForm((prev) => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, _lat: latitude, _lng: longitude } as typeof prev));
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.businessName.trim()) errors.businessName = "Business name is required.";
    if (form.categories.length === 0) errors.categories = "Select at least one service category.";
    if (!form.inspectionFee || isNaN(Number(form.inspectionFee)) || Number(form.inspectionFee) <= 0) {
      errors.inspectionFee = "Please enter a valid positive number.";
    }
    if (!form.location.trim()) {
      errors.location = "Location is required.";
    } else if (!isValidLocation(form.location)) {
      errors.location = "Please enter a valid location (e.g. Brooklyn, NY or London, UK).";
    }
    if (form.website && !isValidWebsite(form.website)) {
      errors.website = "Please enter a valid website URL.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !user) return;
    const specialtiesArr = form.specialties.split(",").map((s) => s.trim()).filter(Boolean);
    const formAny = form as typeof form & { _lat?: number; _lng?: number };
    const lat = formAny._lat ? Number(formAny._lat) : undefined;
    const lng = formAny._lng ? Number(formAny._lng) : undefined;
    const primaryCategory = form.categories[0] ?? "";
    const websiteUrl = form.website.trim() ? (form.website.startsWith("http") ? form.website.trim() : `https://${form.website.trim()}`) : undefined;

    if (editingId) {
      updateProvider(editingId, {
        businessName: form.businessName,
        name: form.businessName,
        category: primaryCategory,
        categories: form.categories,
        description: form.description,
        phone: form.phone,
        website: websiteUrl,
        location: form.location,
        inspectionFee: Number(form.inspectionFee),
        specialties: specialtiesArr,
        available: form.available,
        imageUrl: form.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.businessName)}&background=7c3aed&color=fff&size=400`,
        latitude: lat,
        longitude: lng,
        providerType: form.providerType,
      });
    } else {
      const newProvider: ServiceProvider = {
        id: `p-${Date.now()}`,
        ownerUid: user.uid,
        businessName: form.businessName,
        name: form.businessName,
        category: primaryCategory,
        categories: form.categories,
        description: form.description,
        phone: form.phone,
        website: websiteUrl,
        location: form.location,
        inspectionFee: Number(form.inspectionFee),
        specialties: specialtiesArr,
        available: form.available,
        imageUrl: form.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.businessName)}&background=7c3aed&color=fff&size=400`,
        rating: 5.0,
        reviewCount: 0,
        distanceMiles: 0,
        latitude: lat,
        longitude: lng,
        providerType: form.providerType,
      };
      addProvider(newProvider);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setTab("listings"); resetForm(); }, 2000);
  };

  const handleAcceptRequest = (reqId: string) => {
    updateRequest(reqId, { status: "accepted", updatedAt: new Date() });
    const req = requests.find(r => r.id === reqId);
    if (req) addNotification({ userId: req.userId, title: "Request Accepted!", body: "Your service request has been accepted by the business.", read: false, requestId: reqId });
  };

  const handleSendQuote = (reqId: string) => {
    const amount = Number(quoteForms[reqId]);
    if (!amount || amount <= 0) return;
    updateRequest(reqId, { quote: amount, status: "quote_provided", updatedAt: new Date() });
    const req = requests.find(r => r.id === reqId);
    if (req) addNotification({ userId: req.userId, title: "Quote Received!", body: `You've received a quote of ${formatCurrency(amount)} for your service request.`, read: false, requestId: reqId });
    setQuoteForms(prev => { const n = { ...prev }; delete n[reqId]; return n; });
  };

  // ── Auth Gate ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-scroll flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-scroll flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-violet-50 flex items-center justify-center mb-5">
          <span className="text-4xl">🏢</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Business Dashboard</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-xs">Sign in to create and manage your service listings, track job requests, and grow your business.</p>
        <button onClick={handleSignIn} disabled={signingIn}
          className="w-full max-w-xs bg-violet-600 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-violet-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          {signingIn ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in…</> : "Sign in with Google"}
        </button>
      </div>
    );
  }

  return (
    <div className="page-scroll">
      {/* Header */}
      <div className="bg-white safe-top px-5 pb-0 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900">Business Dashboard</h1>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(["listings", "create", "requests"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${tab === t ? "text-violet-600 border-b-2 border-violet-500" : "text-gray-400"}`}>
              {t === "listings" ? `My Listings (${myListings.length})` : t === "requests" ? `Requests (${myRequests.length})` : editingId ? "Edit Listing" : "Create Listing"}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Tab */}
      {tab === "listings" && (
        <div className="px-4 pt-4 space-y-3">
          {myListings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🏪</p>
              <h3 className="font-bold text-gray-700 mb-1">No listings yet</h3>
              <p className="text-sm text-gray-400 mb-4">Create your first service listing to start getting customers.</p>
              <button onClick={() => setTab("create")} className="bg-violet-600 text-white font-bold px-6 py-3 rounded-2xl text-sm">Create Listing</button>
            </div>
          ) : (
            myListings.map((p) => {
              const isUnverified = p.providerType === "individual" && p.reviewCount < 20;
              return (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-black text-gray-900 truncate">{p.businessName || p.name}</p>
                        {isUnverified && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-600">UNVERIFIED</span>}
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${p.providerType === "individual" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                          {p.providerType === "individual" ? "👤 Solo Pro" : "🏢 Business"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(p.categories ?? [p.category]).map(catId => {
                          const cat = MOCK_CATEGORIES.find(c => c.id === catId);
                          return cat ? (
                            <span key={catId} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-semibold">{cat.icon} {cat.name}</span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.available ? "bg-emerald-400" : "bg-gray-300"}`} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span>📍 {p.location}</span>
                    <span className="text-gray-200">·</span>
                    <span>💰 {formatCurrency(p.inspectionFee)} fee</span>
                  </div>
                  {p.phone && <p className="text-xs text-gray-500 mb-1">📞 {p.phone}</p>}
                  {p.website && <p className="text-xs text-blue-500 mb-1 truncate">🌐 {p.website}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleEdit(p)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 active:bg-gray-50">Edit</button>
                    <button onClick={() => setConfirmDelete(p.id)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 active:bg-red-100">Delete</button>
                  </div>
                </div>
              );
            })
          )}
          <div className="h-4" />
        </div>
      )}

      {/* Create/Edit Tab */}
      {tab === "create" && (
        <div ref={formRef} className="px-4 pt-4 space-y-4 pb-8">
          {saved && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <p className="text-sm font-black text-emerald-700">✅ {editingId ? "Listing updated!" : "Listing published!"}</p>
            </div>
          )}

          {/* Provider type */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {([ ["individual", "👤", "Individual Pro", "Just me, working solo"], ["business", "🏢", "Business", "I have a team of employees"] ] as const).map(([val, icon, label, desc]) => (
                <button key={val} onClick={() => handleChange("providerType", val)}
                  className={`flex flex-col items-start gap-1 px-3 py-3 rounded-xl text-left transition-all ${form.providerType === val ? "bg-violet-50 border-2 border-violet-400" : "bg-gray-50 border-2 border-transparent"}`}>
                  <span className="text-lg">{icon}</span>
                  <span className={`text-xs font-bold ${form.providerType === val ? "text-violet-700" : "text-gray-700"}`}>{label}</span>
                  <span className="text-[10px] text-gray-400">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Business name */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Business Name <span className="text-red-400">*</span></label>
            <input value={form.businessName} onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="e.g. Joe's Plumbing Services"
              className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border focus:bg-white transition-colors ${formErrors.businessName ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-violet-300"}`} />
            {formErrors.businessName && <p className="text-xs text-red-500 mt-1">{formErrors.businessName}</p>}
          </div>

          {/* Multi-category */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">
              Service Categories <span className="text-red-400">*</span>
              <span className="text-gray-400 font-normal ml-1">(select all that apply)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOCK_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${form.categories.includes(cat.id) ? "bg-violet-50 border-2 border-violet-400 text-violet-700" : "bg-gray-50 border-2 border-transparent text-gray-600"}`}>
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                  {form.categories.includes(cat.id) && <span className="ml-auto text-violet-500 text-xs flex-shrink-0">✓</span>}
                </button>
              ))}
            </div>
            {formErrors.categories && <p className="text-xs text-red-500 mt-1">{formErrors.categories}</p>}
            {form.categories.length > 0 && (
              <p className="text-xs text-violet-500 mt-2 font-semibold">{form.categories.length} categor{form.categories.length === 1 ? "y" : "ies"} selected</p>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Tell customers about your experience, certifications, and what makes you stand out…"
              rows={3} className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors resize-none" />
          </div>

          {/* Inspection Fee */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Inspection Fee ($) <span className="text-red-400">*</span></label>
            <input type="number" value={form.inspectionFee}
              onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) handleChange("inspectionFee", v); }}
              placeholder="e.g. 50" min="0" step="any"
              className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border focus:bg-white transition-colors ${formErrors.inspectionFee ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-violet-300"}`} />
            {formErrors.inspectionFee ? (
              <p className="text-xs text-red-500 mt-1">{formErrors.inspectionFee}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Fee charged to visit a customer's location to assess the job.</p>
            )}
          </div>

          {/* Phone — formatted */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 000-0000" type="tel"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors" />
          </div>

          {/* Website */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Website <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={form.website} onChange={(e) => handleChange("website", e.target.value)}
              placeholder="https://yourbusiness.com" type="url"
              className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border focus:bg-white transition-colors ${formErrors.website ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-violet-300"}`} />
            {formErrors.website && <p className="text-xs text-red-500 mt-1">{formErrors.website}</p>}
          </div>

          {/* Location with Google Maps autocomplete */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Service Area <span className="text-red-400">*</span></label>
            <div className="flex gap-2 relative">
              <div className="flex-1 relative">
                <input value={form.location}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                  placeholder="e.g. Brooklyn, NY or London, UK"
                  className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border focus:bg-white transition-colors ${formErrors.location ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-violet-300"}`} />
                {locationSuggestionsLoading && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-xl mt-1 overflow-hidden">
                    {locationSuggestions.map((s) => (
                      <button key={s.place_id} onMouseDown={() => handleLocationSuggestionSelect(s)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center gap-2">
                        <span className="text-blue-400 flex-shrink-0">📍</span><span className="truncate">{s.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleDetectLocation} disabled={locating}
                className={`w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${locating ? "bg-gray-100" : "bg-violet-50 border border-violet-200 active:bg-violet-100"}`} title="Detect my location">
                {locating ? (
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
                  </svg>
                )}
              </button>
            </div>
            {formErrors.location ? (
              <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Enter City, State/Country or use GPS.</p>
            )}
            {!GOOGLE_MAPS_API && <p className="text-xs text-amber-500 mt-1">⚠ Add VITE_GOOGLE_MAPS_API for location autocomplete.</p>}
          </div>

          {/* Specialties */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Specialties <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <input value={form.specialties} onChange={(e) => handleChange("specialties", e.target.value)}
              placeholder="e.g. Leak Repair, Pipe Installation, Water Heaters"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors" />
          </div>

          {/* Profile Image URL */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Profile Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={form.imageUrl} onChange={(e) => handleChange("imageUrl", e.target.value)}
              placeholder="https://…"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors" />
          </div>

          {/* Available toggle */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">Available for work</p>
              <p className="text-xs text-gray-400">Toggle to pause or activate your listing</p>
            </div>
            <button onClick={() => handleChange("available", !form.available)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.available ? "bg-violet-500" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.available ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { resetForm(); setTab("listings"); }}
              className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 active:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-3.5 rounded-2xl text-sm font-black bg-violet-600 text-white shadow-lg shadow-violet-200 active:scale-[0.98] transition-all">
              {editingId ? "Save Changes" : "Publish Listing"}
            </button>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <div className="px-4 pt-4 space-y-3">
          {myRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <h3 className="font-bold text-gray-700 mb-1">No job requests yet</h3>
              <p className="text-sm text-gray-400">New requests from customers will appear here.</p>
              {myListings.length === 0 && (
                <button onClick={() => setTab("create")} className="mt-4 bg-violet-600 text-white font-bold px-6 py-3 rounded-2xl text-sm">Create a Listing First</button>
              )}
            </div>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 capitalize mb-0.5">{req.categoryId}</p>
                    <p className="text-sm font-bold text-gray-900 line-clamp-2">{req.description}</p>
                  </div>
                  <span className="ml-2 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: getStatusColor(req.status) + "20", color: getStatusColor(req.status) }}>
                    {getStatusLabel(req.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">📍 {req.address}</p>
                {req.inspectionFee && <p className="text-xs text-gray-500 mb-2">Inspection fee: <strong>{formatCurrency(req.inspectionFee)}</strong></p>}
                {req.quote && <p className="text-xs text-emerald-600 font-semibold mb-2">Quote sent: {formatCurrency(req.quote)}</p>}
                {req.status === "pending" && (
                  <button onClick={() => handleAcceptRequest(req.id)}
                    className="w-full mt-1 bg-violet-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm active:scale-[0.98] transition-transform">
                    ✅ Accept Request
                  </button>
                )}
                {req.status === "accepted" && (
                  <div className="mt-2 bg-blue-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-blue-800 mb-2">Send a quote to the customer</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input type="number" placeholder="0" min="0" step="any" value={quoteForms[req.id] || ""}
                          onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) setQuoteForms(prev => ({ ...prev, [req.id]: v })); }}
                          className="w-full bg-white rounded-xl pl-7 pr-3 py-2.5 text-sm text-gray-700 border border-blue-200 focus:border-blue-400" />
                      </div>
                      <button onClick={() => handleSendQuote(req.id)} disabled={!quoteForms[req.id] || Number(quoteForms[req.id]) <= 0}
                        className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-black disabled:opacity-40 active:scale-[0.98]">
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div className="h-4" />
        </div>
      )}

      {/* Delete confirmation sheet */}
      {confirmDelete && (
        <>
          <div className="sheet-overlay" onClick={() => setConfirmDelete(null)} />
          <div className="sheet-panel">
            <div className="px-5 pt-4 pb-8 safe-bottom">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🗑️</span></div>
              <h3 className="text-lg font-black text-gray-900 text-center mb-2">Delete Listing?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone. All associated data will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl text-sm font-black">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
