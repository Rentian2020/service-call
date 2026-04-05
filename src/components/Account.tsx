import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { signInWithGoogle, signOut } from "../services/authService";
import { getStatusColor, getStatusLabel, MOCK_PROVIDERS } from "../utilities/mockData";
import { useAppContext } from "../hooks/useAppContext";
import type { ServiceRequestStatus } from "../types";

const MOCK_REQUESTS = [
  {
    id: "r1",
    category: "Plumbing",
    description: "Burst pipe under kitchen sink",
    status: "in_progress" as ServiceRequestStatus,
    provider: MOCK_PROVIDERS[0],
    date: "Apr 3, 2026",
    estimatedCost: 170,
  },
  {
    id: "r2",
    category: "Electricity",
    description: "Panel upgrade for home office",
    status: "completed" as ServiceRequestStatus,
    provider: MOCK_PROVIDERS[1],
    date: "Mar 28, 2026",
    estimatedCost: 285,
  },
  {
    id: "r3",
    category: "Cleaning",
    description: "Post-renovation deep clean",
    status: "pending" as ServiceRequestStatus,
    provider: null,
    date: "Apr 5, 2026",
    estimatedCost: undefined,
  },
  {
    id: "r4",
    category: "HVAC",
    description: "AC unit not cooling properly",
    status: "accepted" as ServiceRequestStatus,
    provider: MOCK_PROVIDERS[5],
    date: "Apr 4, 2026",
    estimatedCost: 220,
  },
  {
    id: "r5",
    category: "Painting",
    description: "Interior living room repaint — two coats",
    status: "completed" as ServiceRequestStatus,
    provider: MOCK_PROVIDERS[4],
    date: "Mar 15, 2026",
    estimatedCost: 390,
  },
  {
    id: "r6",
    category: "Locksmith",
    description: "Front door lock replacement after break-in attempt",
    status: "en_route" as ServiceRequestStatus,
    provider: MOCK_PROVIDERS[9],
    date: "Apr 4, 2026",
    estimatedCost: 120,
  },
];

const PROGRESS_STEPS: ServiceRequestStatus[] = [
  "pending",
  "accepted",
  "en_route",
  "in_progress",
  "completed",
];

const getStepIndex = (status: ServiceRequestStatus) =>
  PROGRESS_STEPS.indexOf(status);

export const Account = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { bookmarked } = useAppContext();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      setError("Sign out failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8 pb-24">
        <div className="w-20 h-20 rounded-3xl bg-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome to ServiceCall</h1>
        <p className="text-sm text-gray-500 text-center mb-10 leading-relaxed">
          Sign in to book services, track your jobs, and connect with local professionals.
        </p>

        {error && (
          <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
        )}

        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-4 shadow-sm text-sm font-semibold text-gray-800 transition-transform active:scale-[0.98] mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {signingIn ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    );
  }

  const activeRequests = MOCK_REQUESTS.filter(
    (r) => r.status !== "completed" && r.status !== "cancelled"
  );
  const completedRequests = MOCK_REQUESTS.filter(
    (r) => r.status === "completed" || r.status === "cancelled"
  );
  const displayRequests = activeTab === "active" ? activeRequests : completedRequests;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User"}
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {user.displayName?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {user.displayName ?? "User"}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-5 bg-gray-50 rounded-2xl p-4">
          {[
            { label: "Jobs Done", value: String(completedRequests.length) },
            { label: "In Progress", value: String(activeRequests.length) },
            { label: "Saved", value: String(bookmarked.size) },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 text-center">
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Requests section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">My Requests</h2>
            <button
              onClick={() => navigate("/request")}
              className="text-xs font-semibold text-blue-500"
            >
              + New
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            {(["active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                {tab === "active" ? `Active (${activeRequests.length})` : `History (${completedRequests.length})`}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayRequests.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm font-medium text-gray-500">No {activeTab} requests</p>
              </div>
            ) : (
              displayRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{req.category}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>
                    </div>
                    <span
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3"
                      style={{
                        backgroundColor: `${getStatusColor(req.status)}18`,
                        color: getStatusColor(req.status),
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: getStatusColor(req.status) }}
                      />
                      {getStatusLabel(req.status)}
                    </span>
                  </div>

                  {/* Progress tracker for active requests */}
                  {req.status !== "completed" && req.status !== "cancelled" && (
                    <div className="mb-3">
                      <div className="flex items-center">
                        {PROGRESS_STEPS.map((step, i) => {
                          const currentIdx = getStepIndex(req.status);
                          const isPast = i <= currentIdx;
                          const isLast = i === PROGRESS_STEPS.length - 1;
                          return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                              <div
                                className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${
                                  isPast ? "bg-blue-500" : "bg-gray-200"
                                }`}
                              />
                              {!isLast && (
                                <div
                                  className={`flex-1 h-0.5 transition-colors ${
                                    i < currentIdx ? "bg-blue-500" : "bg-gray-200"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {PROGRESS_STEPS.map((step) => (
                          <span key={step} className="text-[9px] text-gray-400 capitalize">
                            {step.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    {req.provider ? (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={req.provider.imageUrl}
                          alt={req.provider.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{req.provider.name}</span>
                      </div>
                    ) : (
                      <span className="italic text-gray-400">Matching provider...</span>
                    )}
                    <div className="flex items-center gap-2">
                      {req.estimatedCost && (
                        <span className="font-semibold text-gray-600">~${req.estimatedCost}</span>
                      )}
                      <span>{req.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* New request CTA */}
        <button
          onClick={() => navigate("/request")}
          className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-sm shadow-blue-200 text-sm active:scale-[0.98] transition-transform"
        >
          + New Service Request
        </button>

        {/* Settings */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[
            { label: "Edit Profile", icon: "👤" },
            { label: "Notifications", icon: "🔔" },
            { label: "Payment Methods", icon: "💳" },
            { label: "Help & Support", icon: "🛟" },
          ].map(({ label, icon }) => (
            <button
              key={label}
              className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span>{icon}</span>
                {label}
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </section>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full border-2 border-red-100 text-red-500 font-semibold py-4 rounded-2xl text-sm active:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
