import { useAppContext } from "../hooks/useAppContext";

interface NotificationsPanelProps {
  onClose: () => void;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const NotificationsPanel = ({ onClose }: NotificationsPanelProps) => {
  const { notifications, unreadCount, markAllRead, markRead } = useAppContext();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-blue-500"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`w-full text-left px-5 py-4 transition-colors hover:bg-gray-50 ${
                    !notif.read ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${!notif.read ? "bg-blue-500" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-gray-900 ${!notif.read ? "" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-snug">{notif.body}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
