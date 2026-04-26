import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { useAuth } from "./useAuth";
import { isFirebaseConfigured } from "../services/firebase";
import {
  createServiceRequest,
  subscribeServiceRequests,
  updateServiceRequestDocument,
} from "../services/serviceRequestFirestore";
import { updateUserLastKnownLocation } from "../services/userProfileService";

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
  addRequest: (r: ServiceRequest) => Promise<string>;
  updateRequest: (id: string, updates: Partial<ServiceRequest>) => Promise<void>;

  // Payments
  payments: Payment[];
  processPayment: (requestId: string, userId: string, providerId: string, amount: number) => Promise<boolean>;

  // Reviews
  reviews: Review[];
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  updateReview: (id: string, updates: Pick<Review, "rating" | "comment">) => void;
  getProviderReviews: (providerId: string) => Review[];
  getUserReviewForProvider: (providerId: string, userId: string) => Review | undefined;
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
  addRequest: async () => "",
  updateRequest: async () => {},
  payments: [],
  processPayment: async () => false,
  reviews: [],
  addReview: () => {},
  updateReview: () => {},
  getProviderReviews: () => [],
  getUserReviewForProvider: () => undefined,
});

const PROVIDERS_STORAGE_KEY = "servicecall_marketplace_providers";
const REQUESTS_STORAGE_KEY = "servicecall_marketplace_requests";

const loadStoredProviders = (): ServiceProvider[] => {
  try {
    const raw = localStorage.getItem(PROVIDERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ServiceProvider[]) : [];
  } catch {
    return [];
  }
};

const loadStoredRequests = (): ServiceRequest[] => {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<ServiceRequest & { createdAt: string; updatedAt: string }>;
    return parsed.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    }));
  } catch {
    return [];
  }
};

export const AppProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState("Detecting location…");
  const [userLat, setUserLat] = useState(40.7128);
  const [userLng, setUserLng] = useState(-74.006);
  const [locationDetecting, setLocationDetecting] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>(() => loadStoredProviders());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const locationSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ownedProviderIds = useMemo(
    () => (user ? providers.filter((p) => p.ownerUid === user.uid).map((p) => p.id) : []),
    [providers, user]
  );
  const ownedProviderIdsKey = useMemo(() => ownedProviderIds.join(","), [ownedProviderIds]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setRequests(loadStoredRequests());
      return;
    }
    if (!user) {
      setRequests(loadStoredRequests());
    }
  }, [isFirebaseConfigured, user?.uid]);

  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
      return;
    }
    const unsub = subscribeServiceRequests(user.uid, ownedProviderIds, setRequests);
    return unsub;
  }, [isFirebaseConfigured, user, ownedProviderIdsKey, ownedProviderIds]);

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
    const GOOGLE_MAPS_API = import.meta.env.VITE_GOOGLE_MAPS_API as string | undefined;

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
          let label = "";
          if (GOOGLE_MAPS_API) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=locality|administrative_area_level_1&key=${GOOGLE_MAPS_API}`
            );
            const data = await res.json();
            if (data.results?.[0]) {
              const comps = data.results[0].address_components as Array<{ long_name: string; short_name: string; types: string[] }>;
              const city = comps.find(c => c.types.includes("locality"))?.long_name || "";
              const state = comps.find(c => c.types.includes("administrative_area_level_1"))?.short_name || "";
              const country = comps.find(c => c.types.includes("country"))?.short_name || "";
              label = [city, state, country].filter(Boolean).join(", ");
            }
          }
          if (!label) {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const state = data.address?.state || "";
            const country = data.address?.country_code?.toUpperCase() || "";
            label = [city, state, country].filter(Boolean).join(", ");
          }
          setLocation(label || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
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

  useEffect(() => {
    try {
      localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
    } catch {
      // ignore localStorage errors
    }
  }, [providers]);

  useEffect(() => {
    if (isFirebaseConfigured && user) {
      return;
    }
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    } catch {
      // ignore localStorage errors
    }
  }, [requests, isFirebaseConfigured, user]);

  useEffect(() => {
    if (!isFirebaseConfigured || !user || !locationDetected) {
      return;
    }
    if (location === "Detecting location…") {
      return;
    }
    if (locationSyncTimer.current) {
      clearTimeout(locationSyncTimer.current);
    }
    locationSyncTimer.current = setTimeout(() => {
      void updateUserLastKnownLocation(user.uid, { label: location, lat: userLat, lng: userLng });
    }, 4000);
    return () => {
      if (locationSyncTimer.current) {
        clearTimeout(locationSyncTimer.current);
      }
    };
  }, [isFirebaseConfigured, user, locationDetected, location, userLat, userLng]);

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

  const addRequest = useCallback(
    async (r: ServiceRequest) => {
      if (isFirebaseConfigured && user) {
        return createServiceRequest({
          ...r,
          userId: user.uid,
          customerEmail: r.customerEmail ?? user.email ?? undefined,
          customerName: r.customerName ?? user.displayName ?? undefined,
        });
      }
      setRequests((prev) => [r, ...prev]);
      return r.id;
    },
    [isFirebaseConfigured, user]
  );

  const updateRequest = useCallback(
    async (id: string, updates: Partial<ServiceRequest>) => {
      const next: Partial<ServiceRequest> = { ...updates, updatedAt: updates.updatedAt ?? new Date() };
      if (isFirebaseConfigured && user) {
        await updateServiceRequestDocument(id, next);
        return;
      }
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } as ServiceRequest : r)));
    },
    [isFirebaseConfigured, user]
  );

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
      await updateRequest(requestId, { paymentStatus: "paid", status: "completed" });
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
    setReviews((prev) => {
      // Enforce one review per user per provider — if exists, replace
      const filtered = prev.filter(rv => !(rv.providerId === r.providerId && rv.userId === r.userId));
      return [review, ...filtered];
    });
    // Recalculate provider rating
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== r.providerId) return p;
        const provReviews = [...reviews.filter(rv => rv.providerId === r.providerId && rv.userId !== r.userId), review];
        const avgRating = provReviews.reduce((sum, rv) => sum + rv.rating, 0) / provReviews.length;
        return { ...p, rating: Math.round(avgRating * 10) / 10, reviewCount: provReviews.length };
      })
    );
  }, [reviews]);

  const updateReview = useCallback((id: string, updates: Pick<Review, "rating" | "comment">) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
    // Recalculate provider rating after edit
    setReviews((prev) => {
      const updated = prev.find(r => r.id === id);
      if (!updated) return prev;
      const providerId = updated.providerId;
      const provReviews = prev.map(r => r.id === id ? { ...r, ...updates } : r).filter(r => r.providerId === providerId);
      setProviders((p) => p.map((prov) => {
        if (prov.id !== providerId) return prov;
        const avg = provReviews.reduce((s, rv) => s + rv.rating, 0) / provReviews.length;
        return { ...prov, rating: Math.round(avg * 10) / 10 };
      }));
      return prev.map(r => r.id === id ? { ...r, ...updates } : r);
    });
  }, []);

  const getProviderReviews = useCallback((providerId: string) => {
    return reviews.filter((r) => r.providerId === providerId);
  }, [reviews]);

  const getUserReviewForProvider = useCallback((providerId: string, userId: string) => {
    return reviews.find((r) => r.providerId === providerId && r.userId === userId);
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
        updateReview,
        getProviderReviews,
        getUserReviewForProvider,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
