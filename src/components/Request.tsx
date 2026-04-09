import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MOCK_CATEGORIES, formatCurrency } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import type { ServiceProvider, ServiceRequest } from "../types";

type Step = 1 | 2 | 3 | 4 | 5;

interface RequestForm {
  categoryId: string;
  description: string;
  urgency: "scheduled" | "urgent";
  providerId: string;
  address: string;
  scheduledDate: string;
}

const INITIAL_FORM: RequestForm = {
  categoryId: "",
  description: "",
  urgency: "scheduled",
  providerId: "",
  address: "",
  scheduledDate: "",
};

const STEP_LABELS = ["Service", "Nearby", "Choose Pro", "Details", "Confirm"];
const GOOGLE_MAPS_API = import.meta.env.VITE_GOOGLE_MAPS_API;

export const Request = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const { location: userLocation, providers, addRequest, addNotification } = useAppContext();
  const { user } = useAuth();

  const preselectedProviderId =
    (locationState.state as { providerId?: string } | null)?.providerId ?? "";

  const [form, setForm] = useState<RequestForm>({
    ...INITIAL_FORM,
    providerId: preselectedProviderId,
    address: "",
  });
  const [step, setStep] = useState<Step>(preselectedProviderId ? 3 : 1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (userLocation && userLocation !== "Detecting location…" && !form.address) {
      setForm((prev) => ({ ...prev, address: userLocation }));
    }
  }, [userLocation]);

  const handleChange = <K extends keyof RequestForm>(key: K, value: RequestForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchAddressSuggestions = async (input: string) => {
    if (input.length < 3) { setAddressSuggestions([]); return; }
    if (!GOOGLE_MAPS_API) { setAddressSuggestions([]); return; }
    setAddressLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${GOOGLE_MAPS_API}`
      );
      const data = await res.json();
      if (data.predictions) {
        setAddressSuggestions(data.predictions.map((p: { description: string }) => p.description));
      }
    } catch { setAddressSuggestions([]); }
    setAddressLoading(false);
  };

  const isValidAddress = (addr: string): boolean => {
    const t = addr.trim();
    return t.length >= 5 && /[a-zA-Z]{2,}/.test(t) && !/^\d+$/.test(t);
  };

  const matchingProviders = providers.filter(
    (p) =>
      p.available &&
      (!form.categoryId ||
        p.category === form.categoryId ||
        (p.categories && p.categories.includes(form.categoryId)))
  ).sort((a, b) => a.distanceMiles - b.distanceMiles);

  const selectedProvider = providers.find((p) => p.id === form.providerId);
  const selectedCategory = MOCK_CATEGORIES.find((c) => c.id === form.categoryId);

  const goNext = () => setStep((s) => Math.min(5, s + 1) as Step);
  const goBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const step1Valid = !!form.categoryId && form.description.trim().length > 0;
  const step3Valid = !!form.providerId;
  const step4Valid = form.address.trim().length > 0 && isValidAddress(form.address);

  const handleSubmit = async () => {
    if (!user) { navigate("/account"); return; }
    if (!selectedProvider) return;
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1200));
    const newRequest: ServiceRequest = {
      id: `req-${Date.now()}`,
      userId: user.uid,
      providerId: selectedProvider.id,
      categoryId: form.categoryId,
      description: form.description,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      address: form.address,
      inspectionFee: selectedProvider.inspectionFee,
    };
    addRequest(newRequest);
    addNotification({
      userId: user.uid,
      title: "Request Submitted!",
      body: `Your request has been sent to ${selectedProvider.businessName || selectedProvider.name}.`,
      read: false,
      requestId: newRequest.id,
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page-scroll flex flex-col items-center justify-center px-6 text-center min-h-screen">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-5">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Request Sent!</h2>
        <p className="text-sm text-gray-500 mb-2 max-w-xs">
          Your request has been sent to <strong>{selectedProvider?.businessName || selectedProvider?.name}</strong>.
        </p>
        <p className="text-xs text-gray-400 mb-8 max-w-xs">They'll review it and reach out to schedule an inspection visit.</p>
        <div className="bg-blue-50 rounded-2xl p-4 mb-8 text-left w-full max-w-xs">
          {["Business reviews & accepts your request","They visit to inspect and assess the job","You receive a custom quote","Accept & pay only on completion"].map((s, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</div>
              <p className="text-xs text-blue-700">{s}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => navigate("/account")} className="flex-1 bg-blue-500 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-200">Track Request</button>
          <button onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); setStep(1); }} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-4 rounded-2xl text-sm">New Request</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-scroll">
      {/* Header + Progress */}
      <div className="bg-white safe-top px-5 pb-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (step === 1 ? navigate(-1) : goBack())}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-black text-gray-900">Book a Service</h1>
            <p className="text-xs text-gray-400">{STEP_LABELS[step - 1]}</p>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{step}/5</span>
        </div>
        <div className="flex gap-1.5">
          {([1, 2, 3, 4, 5] as const).map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s < step ? "bg-emerald-400" : s === step ? "bg-blue-500" : "bg-gray-100"}`} />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {STEP_LABELS.map((label, i) => (
            <span key={label} className={`text-[9px] font-semibold ${i + 1 === step ? "text-blue-500" : i + 1 < step ? "text-emerald-500" : "text-gray-300"}`}>{label}</span>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-8">

        {/* Step 1: Select Service */}
        {step === 1 && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 mb-3">What do you need? <span className="text-red-400">*</span></h3>
              <div className="grid grid-cols-3 gap-2">
                {MOCK_CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => handleChange("categoryId", cat.id)}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all ${form.categoryId === cat.id ? "bg-blue-50 border-2 border-blue-400 text-blue-700" : "bg-gray-50 border-2 border-transparent text-gray-600 active:bg-gray-100"}`}>
                    <span className="text-xl">{cat.icon}</span>{cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 mb-2">Describe the issue <span className="text-red-400">*</span></h3>
              <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)}
                placeholder="e.g. Leaking pipe under kitchen sink, water pooling on floor…" rows={4} maxLength={500}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors resize-none" />
              <p className="text-xs text-gray-400 mt-1">{form.description.length}/500</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 mb-3">When do you need it?</h3>
              <div className="grid grid-cols-2 gap-3">
                {(["scheduled", "urgent"] as const).map((u) => (
                  <button key={u} onClick={() => handleChange("urgency", u)}
                    className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${form.urgency === u ? (u === "urgent" ? "bg-red-50 border-2 border-red-400 text-red-700" : "bg-blue-50 border-2 border-blue-400 text-blue-700") : "bg-gray-50 border-2 border-transparent text-gray-600"}`}>
                    {u === "urgent" ? "🚨 ASAP / Urgent" : "📅 Schedule Later"}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => step1Valid && goNext()} disabled={!step1Valid}
              className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${step1Valid ? "bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]" : "bg-gray-100 text-gray-400"}`}>
              See Available Providers →
            </button>
          </>
        )}

        {/* Step 2: Nearby Providers */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{selectedCategory?.icon}</span>
              <div>
                <h3 className="text-sm font-black text-gray-900">{selectedCategory?.name} Providers</h3>
                <p className="text-xs text-gray-400">📍 Near {userLocation}</p>
              </div>
            </div>
            {matchingProviders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <h3 className="font-black text-gray-800 mb-2">No Services Available</h3>
                <p className="text-sm text-gray-500 mb-4">There are currently no {selectedCategory?.name.toLowerCase()} providers in your area.</p>
                <button onClick={goBack} className="bg-blue-50 text-blue-600 font-bold px-6 py-3 rounded-2xl text-sm">Try a Different Category</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-1">{matchingProviders.length} provider{matchingProviders.length !== 1 ? "s" : ""} found nearby</p>
                <div className="space-y-3">
                  {matchingProviders.map((p) => (
                    <ProviderRow key={p.id} provider={p} selected={form.providerId === p.id}
                      onSelect={() => handleChange("providerId", form.providerId === p.id ? "" : p.id)} />
                  ))}
                </div>
                <button onClick={goNext} className="w-full py-4 rounded-2xl text-sm font-black bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98] transition-all">
                  Choose a Provider →
                </button>
              </>
            )}
          </>
        )}

        {/* Step 3: Choose Provider */}
        {step === 3 && (
          <>
            <p className="text-sm text-gray-500">Select the provider you'd like to book with.</p>
            {matchingProviders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <h3 className="font-black text-gray-800 mb-2">No Services Available</h3>
                <p className="text-sm text-gray-500 mb-4">There are currently no {selectedCategory?.name.toLowerCase()} providers in your area.</p>
                <button onClick={() => setStep(1)} className="bg-blue-50 text-blue-600 font-bold px-6 py-3 rounded-2xl text-sm">Start Over</button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {matchingProviders.map((p) => (
                    <ProviderRow key={p.id} provider={p} selected={form.providerId === p.id}
                      onSelect={() => handleChange("providerId", p.id)} detailed />
                  ))}
                </div>
                <button onClick={() => step3Valid && goNext()} disabled={!step3Valid}
                  className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${step3Valid ? "bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]" : "bg-gray-100 text-gray-400"}`}>
                  {step3Valid ? "Confirm Provider →" : "Select a Provider to Continue"}
                </button>
              </>
            )}
          </>
        )}

        {/* Step 4: Service Details */}
        {step === 4 && (
          <>
            {selectedProvider && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <img src={selectedProvider.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProvider.businessName || selectedProvider.name)}&background=6366f1&color=fff`}
                  alt={selectedProvider.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{selectedProvider.businessName || selectedProvider.name}</p>
                  <p className="text-xs text-gray-400">⭐ {selectedProvider.rating.toFixed(1)} · {selectedProvider.distanceMiles} mi away</p>
                  <p className="text-xs text-emerald-600 font-semibold">Inspection fee: {formatCurrency(selectedProvider.inspectionFee)}</p>
                </div>
                <button onClick={() => setStep(3)} className="text-xs text-blue-500 font-semibold flex-shrink-0">Change</button>
              </div>
            )}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 mb-1">Service address <span className="text-red-400">*</span></h3>
              <p className="text-xs text-gray-400 mb-3">Where should the professional visit?</p>
              <div className="relative">
                <input value={form.address}
                  onChange={(e) => { handleChange("address", e.target.value); fetchAddressSuggestions(e.target.value); setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g. 123 Main St, Brooklyn, NY 11201"
                  className={`w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border focus:bg-white transition-colors ${form.address.trim() && !isValidAddress(form.address) ? "border-red-200 focus:border-red-300" : "border-gray-100 focus:border-blue-300"}`} />
                {addressLoading && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-100 rounded-xl shadow-xl mt-1 overflow-hidden">
                    {addressSuggestions.map((s, i) => (
                      <button key={i} onMouseDown={() => { handleChange("address", s); setAddressSuggestions([]); setShowSuggestions(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 border-b border-gray-50 last:border-0">
                        📍 {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.address.trim() && !isValidAddress(form.address) && <p className="text-xs text-red-500 mt-1">Please enter a valid street address.</p>}
              {!GOOGLE_MAPS_API && <p className="text-xs text-amber-500 mt-1">⚠ Add VITE_GOOGLE_MAPS_API to .env for address autocomplete.</p>}
            </div>
            {form.urgency === "scheduled" && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 mb-2">Preferred date <span className="text-gray-400 font-normal text-xs">(optional)</span></h3>
                <input type="date" value={form.scheduledDate} onChange={(e) => handleChange("scheduledDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors" />
              </div>
            )}
            <button onClick={() => step4Valid && goNext()} disabled={!step4Valid}
              className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${step4Valid ? "bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]" : "bg-gray-100 text-gray-400"}`}>
              Review & Confirm →
            </button>
          </>
        )}

        {/* Step 5: Final Review & Submit */}
        {step === 5 && (
          <>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-wide mb-3">Review Your Request</h3>
              <div className="space-y-2.5">
                <ReviewRow label="Service" value={`${selectedCategory?.icon} ${selectedCategory?.name}`} onEdit={() => setStep(1)} />
                <ReviewRow label="Description" value={form.description} onEdit={() => setStep(1)} />
                <ReviewRow label="Urgency" value={form.urgency === "urgent" ? "🚨 ASAP" : "📅 Scheduled"} onEdit={() => setStep(1)} />
                {form.scheduledDate && <ReviewRow label="Date" value={new Date(form.scheduledDate + "T00:00:00").toLocaleDateString()} onEdit={() => setStep(4)} />}
                <ReviewRow label="Provider" value={selectedProvider ? (selectedProvider.businessName || selectedProvider.name) : "—"} onEdit={() => setStep(3)} />
                <ReviewRow label="Address" value={form.address} onEdit={() => setStep(4)} />
                {selectedProvider && <ReviewRow label="Inspection Fee" value={formatCurrency(selectedProvider.inspectionFee)} />}
              </div>
            </div>
            {!user && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                <p className="text-xs text-amber-700 font-semibold">⚠️ You need to sign in to submit.{" "}
                  <button onClick={() => navigate("/account")} className="underline">Sign in now</button></p>
              </div>
            )}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">By submitting you agree that the provider will contact you to schedule a visit. Payment is only due after job completion.</p>
            </div>
            <button onClick={handleSubmit} disabled={loading || !user}
              className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${!loading && user ? "bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]" : "bg-gray-100 text-gray-400"}`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…
                </span>
              ) : "✅ Submit Request"}
            </button>
            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  );
};

function ProviderRow({ provider, selected, onSelect, detailed = false }: {
  provider: ServiceProvider; selected: boolean; onSelect: () => void; detailed?: boolean;
}) {
  const isUnverified = provider.providerType === "individual" && provider.reviewCount < 20;
  return (
    <button onClick={onSelect} className={`w-full text-left rounded-2xl p-4 transition-all border-2 ${selected ? "bg-blue-50 border-blue-400" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className="flex items-center gap-3">
        <img src={provider.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.businessName || provider.name)}&background=6366f1&color=fff`}
          alt={provider.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <p className="text-sm font-black text-gray-900 truncate">{provider.businessName || provider.name}</p>
            {isUnverified && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-600 flex-shrink-0">UNVERIFIED</span>}
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black flex-shrink-0 ${provider.providerType === "individual" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
              {provider.providerType === "individual" ? "👤 Solo Pro" : "🏢 Business"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">⭐ {provider.rating.toFixed(1)}</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-500">{provider.reviewCount} reviews</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-500">{provider.distanceMiles} mi</span>
          </div>
          {detailed && provider.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{provider.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="text-xs font-black text-emerald-600">${provider.inspectionFee} fee</p>
          {selected && (
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void; }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-blue-600 flex-shrink-0 w-24">{label}</span>
      <span className="text-xs font-bold text-blue-900 flex-1 text-right line-clamp-2">{value}</span>
      {onEdit && <button onClick={onEdit} className="text-xs text-blue-400 underline flex-shrink-0 ml-1">Edit</button>}
    </div>
  );
}
