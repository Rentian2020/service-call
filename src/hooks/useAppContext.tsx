import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type PropsWithChildren,
} from "react";
import type {
  Notification,
  ServiceProvider,
  Message,
  Conversation,
  ServiceRequest,
  Payment,
  Review,
} from "../types";

interface AppContextValue {
  // Bookmarks
  bookmarked: Set<string>;
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;

  // Location
  location: string;
  setLocation: (loc: string) => void;
  userLat: number;
  userLng: number;
  setUserCoords: (lat: number, lng: number) => void;
  locationDetecting: boolean;
  locationDetected: boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => void;

  // Providers (live, no test data)
  providers: ServiceProvider[];
  addProvider: (p: ServiceProvider) => void;
  updateProvider: (id: string, updates: Partial<ServiceProvider>) => void;
  removeProvider: (id: string) => void;

  // Messages
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, senderId: string, senderName: string, text: string) => void;
  getOrCreateConversation: (userId: string, provider: ServiceProvider) => string;
  totalUnreadMessages: number;

  // Requests
  requests: ServiceRequest[];
  addRequest: (r: ServiceRequest) => void;
  updateRequest: (id: string, updates: Partial<ServiceRequest>) => void;

  // Payments
  payments: Payment[];
  processPayment: (requestId: string, userId: string, providerId: string, amount: number) => Promise<boolean>;

  // Reviews
  reviews: Review[];
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  getProviderReviews: (providerId: string) => Review[];
}

const AppContext = createContext<AppContextValue>({
  bookmarked: new Set(),
  toggleBookmark: () => {},
  isBookmarked: () => false,
  location: "Detecting location…",
  setLocation: () => {},
  userLat: 40.7128,
  userLng: -74.006,
  setUserCoords: () => {},
  locationDetecting: true,
  locationDetected: false,
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
  addNotification: () => {},
  providers: [],
  addProvider: () => {},
  updateProvider: () => {},
  removeProvider: () => {},
  conversations: [],
  messages: {},
  sendMessage: () => {},
  getOrCreateConversation: () => "",
  totalUnreadMessages: 0,
  requests: [],
  addRequest: () => {},
  updateRequest: () => {},
  payments: [],
  processPayment: async () => false,
  reviews: [],
  addReview: () => {},
  getProviderReviews: () => [],
});

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState("Detecting location…");
  const [userLat, setUserLat] = useState(40.7128);
  const [userLng, setUserLng] = useState(-74.006);
  const [locationDetecting, setLocationDetecting] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isBookmarked = (id: string) => bookmarked.has(id);

  const setUserCoords = (lat: number, lng: number) => {
    setUserLat(lat);
    setUserLng(lng);
  };

  // Auto-detect location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation("New York, NY");
      setLocationDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const state = data.address?.state || "";
          const country = data.address?.country_code?.toUpperCase() || "";
          const label = [city, state, country].filter(Boolean).join(", ") || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setLocation(label);
        } catch {
          setLocation(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        }
        setLocationDetecting(false);
        setLocationDetected(true);
      },
      () => {
        setLocation("New York, NY");
        setLocationDetecting(false);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const addNotification = (n: Omit<Notification, "id" | "createdAt">) => {
    const notif: Notification = {
      ...n,
      id: `notif-${Date.now()}`,
      createdAt: new Date(),
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const addProvider = useCallback((p: ServiceProvider) => {
    setProviders((prev) => [...prev, p]);
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<ServiceProvider>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const removeProvider = useCallback((id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getOrCreateConversation = useCallback(
    (userId: string, provider: ServiceProvider): string => {
      const existing = conversations.find(
        (c) => c.userId === userId && c.providerId === provider.id
      );
      if (existing) return existing.id;
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        userId,
        providerId: provider.id,
        providerName: provider.name,
        providerImage: provider.imageUrl,
        lastMessage: "",
        lastMessageAt: new Date(),
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      return newConv.id;
    },
    [conversations]
  );

  const sendMessage = useCallback(
    (conversationId: string, senderId: string, senderName: string, text: string) => {
      const msg: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId,
        senderName,
        text,
        createdAt: new Date(),
        read: false,
      };
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), msg],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: text, lastMessageAt: new Date() }
            : c
        )
      );
    },
    []
  );

  const totalUnreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const addRequest = useCallback((r: ServiceRequest) => {
    setRequests((prev) => [r, ...prev]);
  }, []);

  const updateRequest = useCallback((id: string, updates: Partial<ServiceRequest>) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const processPayment = useCallback(
    async (requestId: string, userId: string, providerId: string, amount: number): Promise<boolean> => {
      await new Promise((res) => setTimeout(res, 1500));
      const payment: Payment = {
        id: `pay-${Date.now()}`,
        requestId,
        userId,
        providerId,
        amount,
        status: "completed",
        method: "card",
        createdAt: new Date(),
      };
      setPayments((prev) => [payment, ...prev]);
      updateRequest(requestId, { paymentStatus: "paid", status: "completed" });
      return true;
    },
    [updateRequest]
  );

  const addReview = useCallback((r: Omit<Review, "id" | "createdAt">) => {
    const review: Review = {
      ...r,
      id: `rev-${Date.now()}`,
      createdAt: new Date(),
    };
    setReviews((prev) => [review, ...prev]);
    // Recalculate provider rating
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== r.providerId) return p;
        const provReviews = [...reviews.filter(rv => rv.providerId === r.providerId), review];
        const avgRating = provReviews.reduce((sum, rv) => sum + rv.rating, 0) / provReviews.length;
        return { ...p, rating: Math.round(avgRating * 10) / 10, reviewCount: provReviews.length };
      })
    );
  }, [reviews]);

  const getProviderReviews = useCallback((providerId: string) => {
    return reviews.filter((r) => r.providerId === providerId);
  }, [reviews]);

  return (
    <AppContext.Provider
      value={{
        bookmarked,
        toggleBookmark,
        isBookmarked,
        location,
        setLocation,
        userLat,
        userLng,
        setUserCoords,
        locationDetecting,
        locationDetected,
        notifications,
        unreadCount,
        markAllRead,
        markRead,
        addNotification,
        providers,
        addProvider,
        updateProvider,
        removeProvider,
        conversations,
        messages,
        sendMessage,
        getOrCreateConversation,
        totalUnreadMessages,
        requests,
        addRequest,
        updateRequest,
        payments,
        processPayment,
        reviews,
        addReview,
        getProviderReviews,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
