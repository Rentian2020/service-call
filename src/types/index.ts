export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: string;        // primary category (for backward compat)
  categories?: string[];   // multiple categories
  rating: number;
  reviewCount: number;
  inspectionFee: number;
  available: boolean;
  location: string;
  distanceMiles: number;
  imageUrl: string;
  specialties: string[];
  ownerUid?: string;
  businessName?: string;
  description?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  providerType?: "individual" | "business";
}

export interface ServiceRequest {
  id: string;
  userId: string;
  providerId: string;
  categoryId: string;
  description: string;
  status: ServiceRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  address: string;
  estimatedCost?: number;
  inspectionFee?: number;
  quote?: number;
  quoteAccepted?: boolean;
  paymentStatus?: "pending" | "paid" | "refunded";
  /** Set when a specific helper is selected or a helper claims an open request (for rules & sync). */
  providerOwnerUid?: string | null;
  /** App-reported user location string when the request was created (e.g. city, ST). */
  capturedLocationLabel?: string;
  /** Browser geolocation at time of request. */
  requestLat?: number;
  requestLng?: number;
  /** Copy of profile / auth (denormalized for dashboard display). */
  customerEmail?: string;
  customerName?: string;
  /** From the request form. */
  urgency?: "scheduled" | "urgent";
}

export type ServiceRequestStatus =
  | "pending"
  | "accepted"
  | "inspection"
  | "quote_provided"
  | "en_route"
  | "in_progress"
  /** Helper marked work done; customer must confirm to close the job */
  | "awaiting_customer"
  | "completed"
  | "cancelled";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  requestId?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  providerId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export interface Payment {
  id: string;
  requestId: string;
  userId: string;
  providerId: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  method?: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  providerId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}
