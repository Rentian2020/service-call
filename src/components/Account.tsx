import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } from "../services/authService";
import { isFirebaseConfigured } from "../services/firebase";
import { getStatusColor, getStatusLabel, formatCurrency } from "../utilities/mockData";
import {
  CUSTOMER_PIPELINE_STEPS,
  getCustomerStatusExplanation,
  getPipelineStepIndex,
  isCancelled,
  isPipelineComplete,
} from "../utilities/jobFlow";
import { useAppContext } from "../hooks/useAppContext";

export const Account = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { bookmarked, requests, providers, updateRequest, addNotification } = useAppContext();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try { await signInWithGoogle(); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign in failed. Please try again."); }
    finally { setSigningIn(false); }
  };

  const handleEmailAuth = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (authTab === "signup" && !nameInput.trim()) {
      setError("Please add your name to create an account.");
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      if (authTab === "signup") await signUpWithEmail(nameInput, emailInput, passwordInput);
      else await signInWithEmail(emailInput, passwordInput);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch {}
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    return (
      <div className="page-scroll">
        {/* Customer Hero */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 safe-top px-5 pb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <span className="role-badge-customer mb-3 inline-block">Customer Portal</span>
          <h1 className="text-2xl font-black text-white mt-2">Your Account</h1>
          <p className="text-blue-100 text-sm mt-2">Sign in to track requests, manage bookings, and chat with helpers.</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[["📍", "Find Pros"], ["📋", "Track Jobs"], ["💬", "Chat"]].map(([icon, label]) => (
              <div key={label} className="bg-white/10 rounded-xl py-3">
                <p className="text-xl mb-1">{icon}</p>
                <p className="text-xs text-blue-100 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pt-6 space-y-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setAuthTab(tab); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  authTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                }`}
              >
                {tab === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {authTab === "signup" && (
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Full name"
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm"
            />
          )}
          <input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm"
          />
          <input
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm"
          />
          <button
            onClick={handleEmailAuth}
            disabled={signingIn}
            className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl text-sm active:scale-[0.98] transition-transform"
          >
            {signingIn ? "Please wait..." : authTab === "signin" ? "Continue" : "Create Account"}
          </button>

          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
          >
            {signingIn ? "Signing in..." : isFirebaseConfigured ? "Sign In with Google" : "Quick Sign In (Local)"}
          </button>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <div className="relative flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            onClick={() => navigate("/business")}
            className="w-full bg-white border-2 border-violet-200 text-violet-600 font-bold py-4 rounded-2xl text-sm active:bg-violet-50 transition-colors"
          >
            🧰 I Want to Offer Help
          </button>
          {!isFirebaseConfigured && (
            <p className="text-[11px] text-amber-600 text-center px-1">
              Running in local auth mode for this clone. Add Firebase env keys to enable real Google OAuth.
            </p>
          )}
        </div>
      </div>
    );
  }

  const userRequests = requests.filter((r) => r.userId === user.uid);
  const activeRequests = userRequests.filter((r) => r.status !== "completed" && r.status !== "cancelled");
  const completedRequests = userRequests.filter((r) => r.status === "completed" || r.status === "cancelled");
  const displayRequests = activeTab === "active" ? activeRequests : completedRequests;

  const handleAcceptQuote = (requestId: string) => {
    void updateRequest(requestId, { status: "en_route", quoteAccepted: true, updatedAt: new Date() });
    const req = requests.find((r) => r.id === requestId);
    const helper = req ? providers.find((p) => p.id === req.providerId) : undefined;
    if (helper?.ownerUid) {
      addNotification({
        userId: helper.ownerUid,
        title: "Customer accepted your price",
        body: "They agreed to your quote. Head over when you are ready, then tap On my way / Started work as you go.",
        read: false,
        requestId,
      });
    }
  };

  const handleConfirmJobComplete = (requestId: string) => {
    void updateRequest(requestId, { status: "completed", updatedAt: new Date() });
    const req = requests.find((r) => r.id === requestId);
    const helper = req ? providers.find((p) => p.id === req.providerId) : undefined;
    if (helper?.ownerUid) {
      addNotification({
        userId: helper.ownerUid,
        title: "Customer confirmed completion",
        body: "The customer confirmed the job is done. Great work.",
        read: false,
        requestId,
      });
    }
  };

  return (
    <div className="page-scroll">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 safe-top px-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/40" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl font-black text-white">{(user.displayName ?? user.email ?? "U")[0].toUpperCase()}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-black text-white text-base">{user.displayName ?? "User"}</p>
                <span className="role-badge-customer">Customer</span>
              </div>
              <p className="text-blue-100 text-xs">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
          >
            Sign Out
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Active Jobs", value: activeRequests.length, icon: "🔧" },
            { label: "Completed", value: completedRequests.length, icon: "✅" },
            { label: "Saved", value: bookmarked.size, icon: "🔖" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/15 rounded-xl py-2.5 px-3 text-center">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[10px] text-blue-100">{icon} {label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => navigate("/business")}
            className="card-press flex flex-col items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-2xl p-3 text-violet-600"
          >
            <span className="text-xl">🏢</span>
            <span className="text-[10px] font-bold">Offer help</span>
          </button>
          <button
            onClick={() => navigate("/bookmarks")}
            className="card-press flex flex-col items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-2xl p-3 text-amber-600"
          >
            <span className="text-xl">🔖</span>
            <span className="text-[10px] font-bold">Saved ({bookmarked.size})</span>
          </button>
          <button
            onClick={() => navigate("/messages")}
            className="card-press flex flex-col items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-emerald-600"
          >
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-bold">Messages</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
          {(["active", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {t === "active" ? `Active (${activeRequests.length})` : `History (${completedRequests.length})`}
            </button>
          ))}
        </div>

        {/* Request Cards */}
        <div className="space-y-3">
          {displayRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">{activeTab === "active" ? "📋" : "✅"}</p>
              <p className="font-bold text-gray-500 text-sm">
                {activeTab === "active" ? "No active requests" : "No completed jobs yet"}
              </p>
              {activeTab === "active" && (
                <button
                  onClick={() => navigate("/request")}
                  className="mt-4 bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
                >
                  Post a Request
                </button>
              )}
            </div>
          ) : (
            displayRequests.map((req) => {
              const provider = providers.find((p) => p.id === req.providerId);
              const pipeIdx = getPipelineStepIndex(req.status);
              const done = isPipelineComplete(req.status);
              const cancelled = isCancelled(req.status);
              return (
                <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{req.categoryId}</span>
                      <p className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2">{req.description}</p>
                    </div>
                    <span
                      className="ml-2 px-2.5 py-1 rounded-full text-[10px] font-black flex-shrink-0"
                      style={{ backgroundColor: getStatusColor(req.status) + "20", color: getStatusColor(req.status) }}
                    >
                      {getStatusLabel(req.status)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">{getCustomerStatusExplanation(req.status)}</p>

                  {provider && (
                    <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-xl p-2.5">
                      <img src={provider.imageUrl} alt={provider.name} className="w-8 h-8 rounded-xl object-cover" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">{provider.businessName || provider.name}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{provider.category}</p>
                      </div>
                    </div>
                  )}
                  {!provider && req.providerId === "unassigned" && (
                    <div className="mb-3 bg-amber-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-amber-700 font-semibold">Looking for helpers nearby...</p>
                    </div>
                  )}

                  {!cancelled && (
                    <div className="mb-3 border border-gray-100 rounded-2xl p-3 bg-slate-50/80">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Progress</p>
                      <ol className="space-y-2">
                        {CUSTOMER_PIPELINE_STEPS.map((step, i) => {
                          const past = done || i < pipeIdx;
                          const current = !done && !cancelled && i === pipeIdx;
                          return (
                            <li key={step.id} className="flex gap-2 items-start">
                              <span
                                className={`mt-0.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                                  past ? "bg-emerald-500 text-white" : current ? "bg-blue-500 text-white ring-2 ring-blue-200" : "bg-gray-200 text-gray-400"
                                }`}
                              >
                                {past ? "✓" : i + 1}
                              </span>
                              <div>
                                <p className={`text-xs font-bold ${current ? "text-blue-700" : past ? "text-emerald-800" : "text-gray-400"}`}>{step.title}</p>
                                <p className="text-[10px] text-gray-500">{step.subtitle}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}

                  {req.inspectionFee && req.providerId !== "unassigned" && (req.status === "pending" || req.status === "accepted") && (
                    <div className="bg-amber-50 rounded-xl px-3 py-2 mb-3">
                      <p className="text-xs text-amber-800">
                        Visit fee (if any): <strong>{formatCurrency(req.inspectionFee)}</strong> — agree with your helper before work starts.
                      </p>
                    </div>
                  )}

                  {req.status === "awaiting_customer" && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-3">
                      <p className="text-xs font-bold text-violet-900 mb-2">Confirm the job is finished</p>
                      <p className="text-[11px] text-violet-800 mb-3">Your helper marked the work complete. Confirm when you are happy so the request can close.</p>
                      <button
                        type="button"
                        onClick={() => handleConfirmJobComplete(req.id)}
                        className="w-full bg-violet-600 text-white text-xs font-black py-2.5 rounded-xl active:scale-[0.98]"
                      >
                        Confirm job complete
                      </button>
                    </div>
                  )}

                  {/* Quote */}
                  {req.quote && req.status === "quote_provided" && !req.quoteAccepted && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-3">
                      <p className="text-sm font-black text-blue-800 mb-2">
                        Quote received: {formatCurrency(req.quote)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptQuote(req.id)}
                          className="flex-1 bg-blue-500 text-white text-xs font-black py-2.5 rounded-xl active:scale-[0.98] transition-transform"
                        >
                          Accept Quote
                        </button>
                        <button
                          onClick={() => void updateRequest(req.id, { status: "cancelled" })}
                          className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2.5 rounded-xl"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  {req.status === "completed" && req.paymentStatus !== "paid" && req.quote && (
                    <button
                      onClick={() => navigate(`/payment/${req.id}`)}
                      className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl text-sm mb-2 shadow-sm active:scale-[0.98] transition-transform"
                    >
                      Pay {formatCurrency(req.quote)}
                    </button>
                  )}
                  {req.paymentStatus === "paid" && (
                    <div className="bg-emerald-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-emerald-700 font-bold text-center">✓ Payment complete</p>
                    </div>
                  )}

                  {provider && (
                    <button
                      onClick={() => navigate(`/provider/${provider.id}`)}
                      className="mt-2 w-full border border-gray-100 text-gray-500 text-xs font-semibold py-2 rounded-xl active:bg-gray-50"
                    >
                      View helper profile
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
};
