import { NavLink } from "react-router-dom";

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/discover",
    label: "Discover",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    to: "/request",
    label: "",
    icon: (_active: boolean) => (
      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
      </svg>
    ),
  },
  {
    to: "/bookmarks",
    label: "Bookmark",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    to: "/account",
    label: "Account",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0">
      <nav className="max-w-lg mx-auto bg-white border-t border-gray-100 shadow-lg rounded-t-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, label, icon }) => {
            const isCenter = label === "";
            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  isCenter
                    ? "flex flex-col items-center justify-center w-12 h-12 rounded-full bg-blue-500 shadow-lg shadow-blue-200 -mt-5"
                    : `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                        isActive ? "text-blue-500" : "text-gray-400"
                      }`
                }
              >
                {({ isActive }) => (
                  <>
                    {icon(isActive)}
                    {label && (
                      <span className={`text-[10px] font-medium ${isActive ? "text-blue-500" : "text-gray-400"}`}>
                        {label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
