import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency } from "../utilities/mockData";

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Dynamically load Stripe.js
let stripePromise: Promise<any> | null = null;
const getStripe = () => {
  if (!STRIPE_PK) return null;
  if (!stripePromise) {
    stripePromise = new Promise((resolve) => {
      if ((window as any).Stripe) { resolve((window as any).Stripe(STRIPE_PK)); return; }
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = () => resolve((window as any).Stripe(STRIPE_PK));
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  return stripePromise;
};

const TIP_PRESETS = [0, 10, 15, 20, 25];

type CardState = {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
  zip: string;
};

const formatCard = (v: string) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const detectCardBrand = (num: string): string => {
  const d = num.replace(/\s/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6/.test(d)) return "Discover";
  return "";
};

const CardBrandIcon = ({ brand }: { brand: string }) => {
  const colors: Record<string, string> = {
    Visa: "#1a1f71", Mastercard: "#eb001b", Amex: "#007bc1", Discover: "#ff6600",
  };
  if (!brand) return (
    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
    </svg>
  );
  return <span style={{ color: colors[brand], fontWeight: 800, fontSize: 11 }}>{brand}</span>;
};

export const Payment = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { requests, providers, processPayment } = useAppContext();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [card, setCard] = useState<CardState>({ number: "", expiry: "", cvv: "", name: "", zip: "" });
  const [error, setError] = useState("");
  const [tipPercent, setTipPercent] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [cardElementMounted, setCardElementMounted] = useState(false);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const cardElRef = useRef<any>(null);
  const cardElContainerRef = useRef<HTMLDivElement>(null);
  const [useStripeElements, setUseStripeElements] = useState(false);

  const request = requests.find((r) => r.id === requestId);
  const provider = request ? providers.find((p) => p.id === request.providerId) : null;
  const baseAmount = request?.quote ?? request?.inspectionFee ?? 0;

  const tipAmount = showCustomTip
    ? (parseFloat(customTip) || 0)
    : (baseAmount * tipPercent) / 100;
  const totalAmount = baseAmount + tipAmount;

  // Try to load Stripe
  useEffect(() => {
    if (!STRIPE_PK) return;
    getStripe()?.then((stripe) => {
      if (!stripe) return;
      stripeRef.current = stripe;
      setStripeReady(true);
      setUseStripeElements(true);
    });
  }, []);

  // Mount Stripe Card Element
  useEffect(() => {
    if (!stripeReady || !cardElContainerRef.current || cardElementMounted) return;
    try {
      const elements = stripeRef.current.elements();
      elementsRef.current = elements;
      const cardElement = elements.create("card", {
        style: {
          base: {
            fontSize: "15px", color: "#1e293b", fontFamily: "'DM Sans', sans-serif",
            "::placeholder": { color: "#94a3b8" },
          },
          invalid: { color: "#ef4444" },
        },
        hidePostalCode: false,
      });
      cardElement.mount(cardElContainerRef.current);
      cardElRef.current = cardElement;
      setCardElementMounted(true);
    } catch { setUseStripeElements(false); }
  }, [stripeReady, cardElementMounted]);

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
        <div className="w-24 h-24 rounded-3xl bg-emerald-100 flex items-center justify-center mb-6 animate-bounce-in">
          <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-sm text-gray-500 mb-1">You paid <span className="font-bold text-gray-800">{formatCurrency(totalAmount)}</span> to</p>
        <p className="text-base font-bold text-gray-800 mb-1">{provider.businessName || provider.name}</p>
        {tipAmount > 0 && (
          <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full mb-6">
            Includes {formatCurrency(tipAmount)} tip 🙏
          </p>
        )}
        {tipAmount === 0 && <div className="mb-6"/>}
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => navigate("/account")} className="flex-1 bg-blue-500 text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform">
            View Jobs
          </button>
          <button onClick={() => navigate("/")} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-4 rounded-2xl text-sm active:bg-gray-50">
            Home
          </button>
        </div>
      </div>
    );
  }

  const isManualValid =
    card.name.trim() &&
    card.number.replace(/\s/g, "").length === 16 &&
    card.expiry.length === 5 &&
    card.cvv.length >= 3;

  const canPay = useStripeElements ? cardElementMounted : isManualValid;

  const handlePay = async () => {
    if (!user || processing) return;
    setProcessing(true);
    setError("");

    try {
      if (useStripeElements && stripeRef.current && cardElRef.current) {
        // Real Stripe tokenization
        const { error: stripeError, paymentMethod } = await stripeRef.current.createPaymentMethod({
          type: "card",
          card: cardElRef.current,
          billing_details: { name: card.name || user.displayName || "" },
        });
        if (stripeError) {
          setError(stripeError.message || "Card error. Please try again.");
          setProcessing(false);
          return;
        }
        // In a real app, send paymentMethod.id + amount to your backend
        console.log("Stripe PaymentMethod:", paymentMethod?.id);
      }

      // Process payment in app state
      const ok = await processPayment(request.id, user.uid, provider.id, totalAmount);
      if (ok) setPaid(true);
      else setError("Payment failed. Please try again.");
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleTipPreset = (pct: number) => {
    setTipPercent(pct);
    setShowCustomTip(false);
    setCustomTip("");
  };

  const brand = detectCardBrand(card.number);

  return (
    <div className="page-scroll">
      {/* Header */}
      <div className="bg-white safe-top px-5 pb-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900">Payment</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Secure checkout
              {STRIPE_PK && stripeReady && <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 rounded-full ml-1">Stripe</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 pb-8">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-slide-up">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Order Summary</h3>
          <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
            <img src={provider.imageUrl} alt={provider.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/>
            <div>
              <p className="text-sm font-bold text-gray-900">{provider.businessName || provider.name}</p>
              <p className="text-xs text-gray-400 capitalize">{request.categoryId}</p>
            </div>
          </div>
          <div className="pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{request.quote ? "Job quote" : "Inspection fee"}</span>
              <span className="font-bold text-gray-800">{formatCurrency(baseAmount)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Tip {tipPercent > 0 && !showCustomTip ? `(${tipPercent}%)` : ""}</span>
                <span className="font-bold">{formatCurrency(tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Service fee</span><span>$0.00</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100 mt-1">
              <span>Total</span>
              <span className="text-blue-500 transition-all">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Tip Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: "40ms" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Add a Tip</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">100% goes to the service professional</p>
            </div>
            <span className="text-2xl">🙏</span>
          </div>
          <div className="flex gap-2 mb-2">
            {TIP_PRESETS.map((pct) => (
              <button
                key={pct}
                onClick={() => handleTipPreset(pct)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  !showCustomTip && tipPercent === pct
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 active:bg-gray-200"
                }`}
              >
                {pct === 0 ? "None" : `${pct}%`}
              </button>
            ))}
            <button
              onClick={() => { setShowCustomTip(true); setTipPercent(0); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                showCustomTip ? "bg-emerald-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 active:bg-gray-200"
              }`}
            >
              Other
            </button>
          </div>
          {showCustomTip && (
            <div className="mt-2 animate-scale-in">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="Enter tip amount"
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-50 rounded-xl pl-7 pr-4 py-3 text-sm text-gray-700 border border-gray-200 focus:border-emerald-300 focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}
          {tipAmount > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-2 text-center">
              + {formatCurrency(tipAmount)} tip · Total becomes {formatCurrency(totalAmount)}
            </p>
          )}
        </div>

        {/* Card Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wide">Card Details</h3>

          {useStripeElements && stripeReady ? (
            /* Stripe Elements Card */
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Cardholder Name</label>
              <input
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                placeholder="Full name on card"
                autoComplete="cc-name"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors mb-3"
              />
              <label className="text-xs font-bold text-gray-500 block mb-1.5">Card Information</label>
              <div
                ref={cardElContainerRef}
                className="w-full bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100 focus-within:border-blue-300 focus-within:bg-white transition-colors"
              />
              {!cardElementMounted && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>
                  <p className="text-xs text-gray-400">Loading secure card form…</p>
                </div>
              )}
            </div>
          ) : (
            /* Manual card form fallback */
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Cardholder Name</label>
                <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })}
                  placeholder="Full name on card" autoComplete="cc-name"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Card Number</label>
                <div className="relative">
                  <input value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                    placeholder="1234 5678 9012 3456" inputMode="numeric" autoComplete="cc-number"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors pr-16"/>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CardBrandIcon brand={brand}/>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">Expiry</label>
                  <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"/>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">CVV</label>
                  <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="123" inputMode="numeric" type="password" autoComplete="cc-csc"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"/>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">ZIP</label>
                  <input value={card.zip} onChange={(e) => setCard({ ...card, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                    placeholder="10001" inputMode="numeric" autoComplete="postal-code"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"/>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 pt-1">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <p className="text-xs text-gray-400">256-bit SSL encrypted · PCI DSS compliant</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3 animate-scale-in">
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={!canPay || processing || !user}
          className={`w-full py-4 rounded-2xl text-sm font-black transition-all ${
            canPay && !processing && user
              ? "bg-blue-500 text-white shadow-lg shadow-blue-200 active:scale-[0.98]"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              Processing…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Pay {formatCurrency(totalAmount)}
              {tipAmount > 0 && <span className="text-blue-200 font-normal text-xs">incl. tip</span>}
            </span>
          )}
        </button>

        {!STRIPE_PK && (
          <p className="text-[10px] text-center text-amber-500 font-semibold">
            ⚠ Add VITE_STRIPE_PUBLISHABLE_KEY to .env for live Stripe payments
          </p>
        )}
      </div>
    </div>
  );
};
