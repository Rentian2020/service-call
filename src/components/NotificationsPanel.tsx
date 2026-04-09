import { useState, useEffect } from "react";
import { useAppContext } from "../hooks/useAppContext";

interface Props { onClose: () => void; }

export const NotificationsPanel = ({ onClose }: Props) => {
  const { notifications, markAllRead, markRead, unreadCount } = useAppContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <div
        className={`sheet-overlay transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className="sheet-panel"
        style={{ transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(100%)", transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)" }}
      >
        <div className="px-5 pt-4 pb-8 safe-bottom">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-xs font-bold text-blue-500">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔔</p>
              <p className="font-bold text-gray-600 mb-1">All caught up!</p>
              <p className="text-sm text-gray-400">Notifications about your jobs will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${
                    !n.read ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !n.read ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <span className="text-base">{!n.read ? "🔔" : "📋"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${!n.read ? "text-gray-900" : "text-gray-600"}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
