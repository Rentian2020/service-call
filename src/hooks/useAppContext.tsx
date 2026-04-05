import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import type { Notification } from "../types";

interface AppContextValue {
  // Bookmarks
  bookmarked: Set<string>;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;

  // Location
  location: string;
  setLocation: (loc: string) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    userId: "user1",
    title: "Request Accepted",
    body: "Marcus Rivera has accepted your plumbing request and is on the way.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    requestId: "r1",
  },
  {
    id: "n2",
    userId: "user1",
    title: "Job Completed",
    body: "Darnell Thompson has completed your electrical panel upgrade. Please leave a review!",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    requestId: "r2",
  },
  {
    id: "n3",
    userId: "user1",
    title: "New Provider Nearby",
    body: "Priya Patel (Painting, ⭐4.9) just became available in your area.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "n4",
    userId: "user1",
    title: "Upcoming Appointment",
    body: "Reminder: Your cleaning service with Sofia Chen is scheduled for tomorrow at 10am.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    requestId: "r3",
  },
];

const AppContext = createContext<AppContextValue>({
  bookmarked: new Set(),
  toggleBookmark: () => {},
  isBookmarked: () => false,
  location: "New York, USA",
  setLocation: () => {},
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
});

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set(["1", "3"]));
  const [location, setLocation] = useState("New York, USA");
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isBookmarked = (id: string) => bookmarked.has(id);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <AppContext.Provider
      value={{
        bookmarked,
        toggleBookmark,
        isBookmarked,
        location,
        setLocation,
        notifications,
        unreadCount,
        markAllRead,
        markRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
