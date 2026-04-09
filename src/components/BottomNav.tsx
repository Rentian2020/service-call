import { NavLink, useLocation } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
  </svg>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);



const BriefcaseIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const BottomNav = () => {
  const { totalUnreadMessages, unreadCount, providers } = useAppContext();
  const { user } = useAuth();
  const hasBusinessListings = user ? providers.some(p => p.ownerUid === user.uid) : false;
  const location = useLocation();

  // Hide nav on chat pages for full immersive experience
  if (location.pathname.startsWith("/chat/")) return null;

  return (
    <nav className="bottom-nav nav-safe-bottom">
      <div className="flex items-center justify-around px-1 pt-2 pb-1">
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${isActive ? "text-blue-600" : "text-gray-400"}`
          }
        >
          {({ isActive }) => (
            <>
              <HomeIcon active={isActive} />
              <span className={`text-[10px] font-semibold ${isActive ? "text-blue-600" : "text-gray-400"}`}>Home</span>
            </>
          )}
        </NavLink>

        {/* Discover */}
        <NavLink
          to="/discover"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${isActive ? "text-blue-600" : "text-gray-400"}`
          }
        >
          {({ isActive }) => (
            <>
              <SearchIcon active={isActive} />
              <span className={`text-[10px] font-semibold ${isActive ? "text-blue-600" : "text-gray-400"}`}>Explore</span>
            </>
          )}
        </NavLink>

        {/* Center CTA */}
        <NavLink
          to="/request"
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-300/50 -mt-5 transition-transform active:scale-95"
          aria-label="New Request"
        >
          <PlusIcon />
        </NavLink>

        {/* Messages */}
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all relative ${isActive ? "text-blue-600" : "text-gray-400"}`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <ChatIcon active={isActive} />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center px-0.5">
                    <span className="text-[9px] font-bold text-white leading-none">{totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}</span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? "text-blue-600" : "text-gray-400"}`}>Messages</span>
            </>
          )}
        </NavLink>

        {/* Business Dashboard (only shown if user has listings) */}
        {hasBusinessListings && (
          <NavLink
            to="/business"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${isActive ? "text-violet-600" : "text-gray-400"}`
            }
          >
            {({ isActive }) => (
              <>
                <BriefcaseIcon active={isActive} />
                <span className={`text-[10px] font-semibold ${isActive ? "text-violet-600" : "text-gray-400"}`}>Business</span>
              </>
            )}
          </NavLink>
        )}

        {/* Account */}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all relative ${isActive ? "text-blue-600" : "text-gray-400"}`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                {user?.photoURL ? (
                  <div className={`w-5 h-5 rounded-full overflow-hidden ring-2 ${isActive ? "ring-blue-500" : "ring-transparent"}`}>
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <UserIcon active={isActive} />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center px-0.5">
                    <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                {user ? "Profile" : "Account"}
              </span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
