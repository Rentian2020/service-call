import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import { signInWithGoogle } from "../services/authService";
import { MOCK_CATEGORIES, formatCurrency, getStatusColor, getStatusLabel } from "../utilities/mockData";
import { getHelperAdvanceAction, getHelperWaitingMessage } from "../utilities/jobFlow";
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
  locationType: "area" as "exact" | "area",  // exact address vs service area
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [quoteForms, setQuoteForms] = useState<Record<string, string>>({});
  const [locationSuggestions, setLocationSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestionsLoading, setLocationSuggestionsLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myListings = providers.filter((p) => p.ownerUid === user?.uid);
  const myRequests = requests.filter((r) => myListings.some((l) => l.id === r.providerId));
  const openRequests = requests.filter((r) => r.providerId === "unassigned" && r.status === "pending");

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

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setSaved(false); setFormErrors({}); setLocationSuggestions([]); setShowAdvanced(false); };

  const handleEdit = (p: ServiceProvider) => {
    setForm({
      businessName: p.businessName ?? "",
      categories: p.categories ?? (p.category ? [p.category] : []),
      description: p.description ?? "",
      phone: p.phone ?? "",
      website: p.website ?? "",
      location: p.location,
      locationType: (p.latitude && p.longitude) ? "exact" : "area",
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
          let label = "";
          if (GOOGLE_MAPS_API) {
            // Use reverse geocoding — extract city, state, country components
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=locality|administrative_area_level_1&key=${GOOGLE_MAPS_API}`);
            const data = await res.json();
            if (data.results?.[0]) {
              const comps = data.results[0].address_components as Array<{ long_name: string; short_name: string; types: string[] }>;
              const city = comps.find(c => c.types.includes("locality"))?.long_name || "";
              const state = comps.find(c => c.types.includes("administrative_area_level_1"))?.short_name || "";
              const country = comps.find(c => c.types.includes("country"))?.short_name || "";
              label = [city, state, country].filter(Boolean).join(", ");
            }
          }
          if (!label) {
            // Fallback: Nominatim
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const state = data.address?.state || "";
            const country = data.address?.country_code?.toUpperCase() || "";
            label = [city, state, country].filter(Boolean).join(", ");
          }
          if (!label) label = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

          setForm((prev) => ({ ...prev, location: label, _lat: latitude, _lng: longitude } as typeof prev));
          setUserCoords(latitude, longitude);
          setAppLocation(label);
          setFormErrors((prev) => ({ ...prev, location: "" }));
        } catch {
          const fallback = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setForm((prev) => ({ ...prev, location: fallback, _lat: latitude, _lng: longitude } as typeof prev));
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
    // Only pin exact coordinates for fixed-address businesses
    const lat = (form.locationType === "exact" && formAny._lat) ? Number(formAny._lat) : undefined;
    const lng = (form.locationType === "exact" && formAny._lng) ? Number(formAny._lng) : undefined;
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

  const notifyCustomerAboutJob = (customerUserId: string, title: string, body: string, requestId: string) => {
    addNotification({ userId: customerUserId, title, body, read: false, requestId });
  };

  /** Advance job stage and ping the customer (same pattern as delivery status updates). */
  const handleAdvanceJob = (reqId: string) => {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;
    const action = getHelperAdvanceAction(req);
    if (!action) return;
    void updateRequest(reqId, { status: action.nextStatus, updatedAt: new Date() });
    notifyCustomerAboutJob(req.userId, action.customerTitle, action.customerBody, reqId);
  };

  const handleSendQuote = (reqId: string) => {
    const amount = Number(quoteForms[reqId]);
    if (!amount || amount <= 0) return;
    void updateRequest(reqId, { quote: amount, status: "quote_provided", updatedAt: new Date() });
    const req = requests.find(r => r.id === reqId);
    if (req) addNotification({ userId: req.userId, title: "Quote Received!", body: `You've received a quote of ${formatCurrency(amount)} for your service request.`, read: false, requestId: reqId });
    setQuoteForms(prev => { const n = { ...prev }; delete n[reqId]; return n; });
  };

  const handleClaimOpenRequest = (reqId: string) => {
    if (myListings.length === 0) {
      setTab("create");
      return;
    }
    const activeListing = myListings.find((l) => l.available) ?? myListings[0];
    void updateRequest(reqId, {
      providerId: activeListing.id,
      status: "accepted",
      updatedAt: new Date(),
      inspectionFee: activeListing.inspectionFee,
      providerOwnerUid: activeListing.ownerUid,
    });
    const req = requests.find((r) => r.id === reqId);
    if (req) {
      addNotification({
        userId: req.userId,
        title: "A helper accepted your request",
        body: `${activeListing.businessName || activeListing.name} is ready to help.`,
        read: false,
        requestId: reqId,
      });
    }
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
        <h2 className="text-2xl font-black text-gray-900 mb-2">Helper Dashboard</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-xs">Sign in to offer help, claim requests, and message customers.</p>
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
            <h1 className="text-lg font-black text-gray-900">Helper Dashboard</h1>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(["listings", "create", "requests"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${tab === t ? "text-violet-600 border-b-2 border-violet-500" : "text-gray-400"}`}>
              {t === "listings" ? `My Profile (${myListings.length})` : t === "requests" ? `Requests (${myRequests.length + openRequests.length})` : editingId ? "Edit Profile" : "Offer Help"}
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
              <h3 className="font-bold text-gray-700 mb-1">No helper profile yet</h3>
              <p className="text-sm text-gray-400 mb-4">Create your profile once so customers can find you.</p>
              <button onClick={() => setTab("create")} className="bg-violet-600 text-white font-bold px-6 py-3 rounded-2xl text-sm">Create Helper Profile</button>
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
                    <button
                      onClick={(e) => { e.stopPropagation(); updateProvider(p.id, { available: !p.available }); }}
                      title={p.available ? "Click to set as Busy" : "Click to set as Available"}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${p.available ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${p.available ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span>📍 {p.location}</span>
                    <span className="text-gray-200">·</span>
                    <span>💰 {formatCurrency(p.inspectionFee)} fee</span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${p.available ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                      {p.available ? "Active" : "Paused"}
                    </span>
                  </div>
                  {p.phone && <p className="text-xs text-gray-500 mb-1">📞 {p.phone}</p>}
                  {p.website && <p className="text-xs text-blue-500 mb-1 truncate">🌐 {p.website}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleEdit(p)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 active:bg-gray-50 transition-colors">Edit</button>
                    <button onClick={() => setConfirmDelete(p.id)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 active:bg-red-100 transition-colors">Delete</button>
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

          {/* Helper name */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Display Name <span className="text-red-400">*</span></label>
            <input value={form.businessName} onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="e.g. Nahiyan - Plumbing Help"
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

          {/* Visit Fee */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Visit Fee ($) <span className="text-red-400">*</span></label>
            <input type="number" value={form.inspectionFee}
              onChange={(e) => { const v = e.target.value; if (v === "" || /^\d*\.?\d*$/.test(v)) handleChange("inspectionFee", v); }}
              placeholder="e.g. 50" min="0" step="any"
              className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border focus:bg-white transition-colors ${formErrors.inspectionFee ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-violet-300"}`} />
            {formErrors.inspectionFee ? (
              <p className="text-xs text-red-500 mt-1">{formErrors.inspectionFee}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Optional upfront fee before a full quote.</p>
            )}
          </div>

          {/* Phone — formatted */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 000-0000" type="tel"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors" />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="w-full text-sm font-semibold text-violet-600 bg-violet-50 rounded-xl py-2.5"
          >
            {showAdvanced ? "Hide optional fields" : "Show optional fields"}
          </button>

          {showAdvanced && (
            <>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Short bio</label>
                <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Tell customers what you can help with..."
                  rows={3} className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors resize-none" />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Website <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={form.website} onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://yourbusiness.com" type="url"
                  className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border focus:bg-white transition-colors ${formErrors.website ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-violet-300"}`} />
                {formErrors.website && <p className="text-xs text-red-500 mt-1">{formErrors.website}</p>}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Specialties <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input value={form.specialties} onChange={(e) => handleChange("specialties", e.target.value)}
                  placeholder="e.g. Leak repair, faucet replacement"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors" />
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Profile Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={form.imageUrl} onChange={(e) => handleChange("imageUrl", e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-violet-300 focus:bg-white transition-colors" />
              </div>
            </>
          )}

          {/* Location with type selector + Google Maps autocomplete */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-500 block mb-2">Location <span className="text-red-400">*</span></label>

            {/* Location type toggle */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {([
                ["area", "🗺️", "Service Area", "City/region — customers come to you"],
                ["exact", "📌", "Exact Address", "Fixed shop or storefront"],
              ] as const).map(([val, icon, label, desc]) => (
                <button key={val} type="button" onClick={() => handleChange("locationType", val)}
                  className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl text-left transition-all ${form.locationType === val ? "bg-violet-50 border-2 border-violet-400" : "bg-gray-50 border-2 border-transparent"}`}>
                  <span className="text-base">{icon}</span>
                  <span className={`text-xs font-bold ${form.locationType === val ? "text-violet-700" : "text-gray-700"}`}>{label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 relative">
              <div className="flex-1 relative">
                <input value={form.location}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                  placeholder={form.locationType === "area" ? "e.g. Brooklyn, NY or London, UK" : "e.g. 123 Main St, New York, NY"}
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
              <button onClick={handleDetectLocation} disabled={locating} type="button"
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
              <p className="text-xs text-gray-400 mt-1">
                {form.locationType === "area"
                  ? "Customers will see your city/region. Distance is approximate."
                  : "Your exact address helps customers find you on the map."}
              </p>
            )}
            {!GOOGLE_MAPS_API && <p className="text-xs text-amber-500 mt-1">⚠ Add VITE_GOOGLE_MAPS_API for autocomplete.</p>}
          </div>

          {/* Available toggle */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">Available for Work</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.available ? "🟢 Your listing is active and accepting jobs" : "⏸️ Listing paused — customers can't book you"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("available", !form.available)}
              role="switch"
              aria-checked={form.available}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none ${form.available ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${form.available ? "translate-x-7" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { resetForm(); setTab("listings"); }}
              className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 active:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-3.5 rounded-2xl text-sm font-black bg-violet-600 text-white shadow-lg shadow-violet-200 active:scale-[0.98] transition-all">
              {editingId ? "Save Changes" : "Go Live"}
            </button>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <div className="px-4 pt-4 space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
            <p className="text-xs font-bold text-blue-800">How jobs move</p>
            <p className="text-xs text-blue-700 mt-1">
              Posted → you accept → On the way → Working → You mark finished → Customer confirms done. Each step notifies them automatically.
            </p>
          </div>

          {openRequests.length > 0 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Open Requests ({openRequests.length})</p>
              {openRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-400 capitalize mb-0.5">{req.categoryId}</p>
                      <p className="text-sm font-bold text-gray-900 line-clamp-2">{req.description}</p>
                    </div>
                    <span className="ml-2 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 bg-amber-100 text-amber-700">
                      OPEN
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">📍 {req.address}</p>
                  <button
                    onClick={() => handleClaimOpenRequest(req.id)}
                    className="w-full bg-violet-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm active:scale-[0.98] transition-transform"
                  >
                    ✅ Claim & Accept Request
                  </button>
                </div>
              ))}
            </>
          )}

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">My Assigned Requests ({myRequests.length})</p>
          {myRequests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <h3 className="font-bold text-gray-700 mb-1">No assigned requests yet</h3>
              <p className="text-sm text-gray-400">Claim an open request above, or wait for direct requests.</p>
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
                {req.inspectionFee && <p className="text-xs text-gray-500 mb-2">Visit fee: <strong>{formatCurrency(req.inspectionFee)}</strong></p>}
                {req.quote && <p className="text-xs text-emerald-600 font-semibold mb-2">Quote sent: {formatCurrency(req.quote)}</p>}
                {getHelperWaitingMessage(req.status) && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-2">{getHelperWaitingMessage(req.status)}</p>
                )}
                {req.status === "accepted" && (
                  <div className="mt-2 bg-blue-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-blue-800 mb-1">Optional: send a price</p>
                    <p className="text-[10px] text-blue-600 mb-2">Or skip and use “On my way” below if you already agreed verbally.</p>
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
                {getHelperAdvanceAction(req) && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceJob(req.id)}
                    className="w-full mt-2 bg-violet-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm active:scale-[0.98] transition-transform"
                  >
                    {getHelperAdvanceAction(req)!.label} →
                  </button>
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
