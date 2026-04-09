import { useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { useAuth } from "../hooks/useAuth";

export const Messages = () => {
  const navigate = useNavigate();
  const { conversations } = useAppContext();
  const { user } = useAuth();

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!user) {
    return (
      <div className="page-scroll">
        <div className="bg-white px-5 safe-top pb-4 sticky top-0 z-40 shadow-sm">
          <h1 className="text-xl font-black text-gray-900">Messages</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h2 className="font-black text-gray-700 text-lg mb-2">Sign in to message</h2>
          <p className="text-sm text-gray-400 mb-6">Chat with service professionals to discuss your needs.</p>
          <button
            onClick={() => navigate("/account")}
            className="bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md shadow-blue-200"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-scroll">
      <div className="bg-white px-5 safe-top pb-4 sticky top-0 z-40 shadow-sm">
        <h1 className="text-xl font-black text-gray-900">Messages</h1>
        {conversations.length > 0 && (
          <p className="text-sm text-gray-400 mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h2 className="font-black text-gray-700 text-lg mb-2">No messages yet</h2>
          <p className="text-sm text-gray-400 mb-6">
            Visit a business profile and tap "Message" to start a conversation.
          </p>
          <button
            onClick={() => navigate("/discover")}
            className="bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-md shadow-blue-200"
          >
            Browse Businesses
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-2 pb-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="card-press bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={conv.providerImage}
                  alt={conv.providerName}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 rounded-full border-2 border-white flex items-center justify-center px-0.5">
                    <span className="text-[9px] font-bold text-white">{conv.unreadCount}</span>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`text-sm font-bold truncate ${conv.unreadCount > 0 ? "text-gray-900" : "text-gray-700"}`}>
                    {conv.providerName}
                  </h3>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                </div>
                <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-gray-700 font-semibold" : "text-gray-400"}`}>
                  {conv.lastMessage || "Start the conversation…"}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
