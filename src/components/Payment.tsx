import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency } from "../utilities/mockData";

export const Payment = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { requests, providers, processPayment } = useAppContext();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const request = requests.find((r) => r.id === requestId);
  const provider = request ? providers.find((p) => p.id === request.providerId) : null;
  const amount = request?.quote ?? request?.inspectionFee ?? 0;

  if (!request || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-3xl mb-3">❌</p>
          <p className="font-bold text-gray-600">Request not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-blue-500 text-sm font-semibold">Go back</button>
        </div>
      </div>
    );
  }

  if (request.paymentStatus === "paid" || paid) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-3xl bg-emerald-100 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-sm text-gray-500 mb-1">You paid {formatCurrency(amount)} to</p>
        <p className="text-base font-bold text-gray-800 mb-8">{provider.businessName || provider.name}</p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate("/account")}
            className="flex-1 bg-blue-500 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-200"
          >
            View Jobs
          </button>
          <button onClick={() => navigate("/")} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-4 rounded-2xl text-sm">
            Home
          </button>
        </div>
      </div>
    );
  }

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

  const formatExpiryVal = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const isValid =
    name.trim() &&
    cardNum.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const handlePay = async () => {
    if (!isValid || !user) return;
    setProcessing(true);
    setError("");
    try {
      const ok = await processPayment(request.id, user.uid, provider.id, amount);
      if (ok) setPaid(true);
      else setError("Payment failed. Please try again.");
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-scroll">
      {/* Header */}
      <div className="bg-white safe-top px-5 pb-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900">Payment</h1>
            <p className="text-xs text-gray-400">Secure checkout</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-8">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Order Summary</h3>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
            <img src={provider.imageUrl} alt={provider.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900">{provider.businessName || provider.name}</p>
              <p className="text-xs text-gray-400 capitalize">{request.categoryId}</p>
            </div>
          </div>
          <div className="pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{request.quote ? "Job quote" : "Inspection fee"}</span>
              <span className="font-bold text-gray-800">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Service fee</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100 mt-1">
              <span>Total</span>
              <span className="text-blue-500">{formatCurrency(amount)}</span>
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Card Details</h3>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Cardholder Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name on card"
              autoComplete="cc-name"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Card Number</label>
            <div className="relative">
              <input
                value={cardNum}
                onChange={(e) => setCardNum(formatCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                autoComplete="cc-number"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors pr-12"
              />
              <svg className="absolute right-3 top-3 w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Expiry</label>
              <input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiryVal(e.target.value))}
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">CVV</label>
              <input
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                inputMode="numeric"
                type="password"
                autoComplete="cc-csc"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-gray-400">Your payment is 256-bit encrypted and secure</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={!isValid || processing || !user}
          className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${
            isValid && !processing && user
              ? "bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing…
            </span>
          ) : `Pay ${formatCurrency(amount)}`}
        </button>
      </div>
    </div>
  );
};
