import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MOCK_CATEGORIES, MOCK_PROVIDERS } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";

interface RequestForm {
  categoryId: string;
  providerId: string;
  description: string;
  address: string;
  urgency: "scheduled" | "urgent";
}

const INITIAL_FORM: RequestForm = {
  categoryId: "",
  providerId: "",
  description: "",
  address: "",
  urgency: "scheduled",
};

export const Request = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { location: userLocation } = useAppContext();
  const preselectedProviderId = (location.state as { providerId?: string } | null)?.providerId ?? "";

  const [form, setForm] = useState<RequestForm>({
    ...INITIAL_FORM,
    providerId: preselectedProviderId,
    address: userLocation,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedProvider = MOCK_PROVIDERS.find((p) => p.id === form.providerId);

  const handleChange = <K extends keyof RequestForm>(key: K, value: RequestForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = form.categoryId && form.description.trim() && form.address.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 pb-24">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          We're connecting you with a nearby technician. You'll receive a notification shortly.
        </p>
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate("/account")}
            className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-blue-200"
          >
            Track My Request
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-white text-gray-700 font-semibold py-4 rounded-2xl text-sm border border-gray-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-5 pt-12 pb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-4 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Request</h1>
        <p className="text-sm text-gray-500 mt-1">Get connected to a pro near you</p>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Category */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Service Category <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-4 gap-3">
            {MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleChange("categoryId", cat.id)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                  form.categoryId === cat.id
                    ? "bg-blue-50 border-2 border-blue-300"
                    : "bg-gray-50 border-2 border-transparent"
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-800 mb-3">Urgency</label>
          <div className="flex gap-3">
            {(["scheduled", "urgent"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleChange("urgency", opt)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  form.urgency === opt
                    ? opt === "urgent"
                      ? "bg-red-50 text-red-600 border-2 border-red-200"
                      : "bg-blue-50 text-blue-600 border-2 border-blue-200"
                    : "bg-gray-50 text-gray-500 border-2 border-transparent"
                }`}
              >
                {opt === "urgent" ? "🚨 Urgent" : "📅 Scheduled"}
              </button>
            ))}
          </div>
        </div>

        {/* Provider */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Preferred Provider (optional)
          </label>
          <select
            value={form.providerId}
            onChange={(e) => handleChange("providerId", e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none border border-gray-100"
          >
            <option value="">Match me with the best available</option>
            {MOCK_PROVIDERS.filter((p) => p.available).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ⭐{p.rating} · {p.distanceMiles}mi away
              </option>
            ))}
          </select>
          {selectedProvider && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <img
                src={selectedProvider.imageUrl}
                alt={selectedProvider.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedProvider.name}</p>
                <p className="text-xs text-gray-500">⭐ {selectedProvider.rating} · {selectedProvider.distanceMiles} miles · {selectedProvider.category}</p>
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Service Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="123 Main St, New York, NY"
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-100"
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Describe the Issue <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="e.g. Burst pipe under the kitchen sink, water is leaking onto the floor..."
            rows={4}
            maxLength={500}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-100 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
        </div>
      </div>

      {/* Submit */}
      <div className="fixed bottom-20 left-0 right-0 px-5 max-w-lg mx-auto">
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className={`w-full font-bold py-4 rounded-2xl text-sm transition-all ${
            isValid && !loading
              ? "bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Connecting you..." : "Send Request"}
        </button>
      </div>
    </div>
  );
};
