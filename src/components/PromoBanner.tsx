import { useState } from "react";

const PROMOS = [
  { bg: "from-amber-400 to-orange-500", emoji: "⚡", title: "Fast & Reliable", sub: "Pros respond within 2 hours" },
  { bg: "from-emerald-400 to-teal-500", emoji: "🛡️", title: "Vetted Pros", sub: "All businesses are verified" },
  { bg: "from-blue-400 to-indigo-500", emoji: "💳", title: "Pay on Completion", sub: "Only pay when the job's done" },
];

export const PromoBanner = () => {
  const [idx, setIdx] = useState(0);
  const promo = PROMOS[idx];

  return (
    <div
      className={`bg-gradient-to-r ${promo.bg} rounded-2xl px-5 py-4 flex items-center gap-3 cursor-pointer relative overflow-hidden`}
      onClick={() => setIdx((prev) => (prev + 1) % PROMOS.length)}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white" />
        <div className="absolute -left-2 -bottom-4 w-16 h-16 rounded-full bg-white" />
      </div>
      <div className="w-10 h-10 rounded-2xl bg-white/25 flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{promo.emoji}</span>
      </div>
      <div className="flex-1">
        <p className="text-white font-black text-sm">{promo.title}</p>
        <p className="text-white/80 text-xs mt-0.5">{promo.sub}</p>
      </div>
      <div className="flex gap-1">
        {PROMOS.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white" : "bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
};
