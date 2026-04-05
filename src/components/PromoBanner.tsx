import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BANNERS = [
  {
    tag: "Limited Time",
    headline: "Up to 40% Off",
    sub: "Top-rated home services",
    cta: "Book Now",
    route: "/request",
    from: "from-blue-500",
    to: "to-blue-700",
    icon: "🔧",
  },
  {
    tag: "New Providers",
    headline: "12 New Pros",
    sub: "Just joined your area",
    cta: "Discover",
    route: "/discover",
    from: "from-violet-500",
    to: "to-purple-700",
    icon: "⭐",
  },
  {
    tag: "Fast Response",
    headline: "Emergency Help",
    sub: "Available 24/7 near you",
    cta: "Get Help",
    route: "/request",
    from: "from-rose-500",
    to: "to-red-700",
    icon: "🚨",
  },
];

export const PromoBanner = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const banner = BANNERS[active];

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${banner.from} ${banner.to} p-6 min-h-[140px] flex items-center transition-all duration-300`}
      >
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute right-20 top-4 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative z-10 flex-1">
          <p className="text-white/80 text-sm font-medium mb-0.5">{banner.tag}</p>
          <h2 className="text-white font-bold text-2xl leading-tight mb-4">
            {banner.headline}<br />
            <span className="text-base font-medium text-white/80">{banner.sub}</span>
          </h2>
          <button
            onClick={() => navigate(banner.route)}
            className="bg-gray-900/80 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
          >
            {banner.cta}
          </button>
        </div>

        {/* Icon */}
        <div className="absolute right-6 bottom-4 text-7xl opacity-20 select-none">
          {banner.icon}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-5 bg-blue-500" : "w-1.5 bg-gray-300"
            }`}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
