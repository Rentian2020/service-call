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
  category: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  available: boolean;
  location: string;
  distanceMiles: number;
  imageUrl: string;
  specialties: string[];
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
}

export type ServiceRequestStatus =
  | "pending"
  | "accepted"
  | "en_route"
  | "in_progress"
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
