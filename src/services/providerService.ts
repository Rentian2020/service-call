import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ServiceProvider, ServiceRequest, Bookmark } from "../types";

export const getProviders = async (
  categoryId?: string
): Promise<ServiceProvider[]> => {
  try {
    const ref = collection(db, "providers");
    const q = categoryId
      ? query(ref, where("category", "==", categoryId))
      : query(ref);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ServiceProvider);
  } catch (error) {
    throw new Error(`Failed to fetch providers: ${error}`);
  }
};

export const getProviderById = async (
  id: string
): Promise<ServiceProvider | null> => {
  try {
    const ref = doc(db, "providers", id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as ServiceProvider;
  } catch (error) {
    throw new Error(`Failed to fetch provider: ${error}`);
  }
};

export const createServiceRequest = async (
  request: Omit<ServiceRequest, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const ref = await addDoc(collection(db, "serviceRequests"), {
      ...request,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    throw new Error(`Failed to create request: ${error}`);
  }
};

export const getUserRequests = async (
  userId: string
): Promise<ServiceRequest[]> => {
  try {
    const q = query(
      collection(db, "serviceRequests"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        scheduledAt: data.scheduledAt?.toDate(),
      } as ServiceRequest;
    });
  } catch (error) {
    throw new Error(`Failed to fetch requests: ${error}`);
  }
};

export const getUserBookmarks = async (userId: string): Promise<Bookmark[]> => {
  try {
    const q = query(
      collection(db, "bookmarks"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      } as Bookmark;
    });
  } catch (error) {
    throw new Error(`Failed to fetch bookmarks: ${error}`);
  }
};

export const addBookmark = async (
  userId: string,
  providerId: string
): Promise<string> => {
  try {
    const ref = await addDoc(collection(db, "bookmarks"), {
      userId,
      providerId,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    throw new Error(`Failed to add bookmark: ${error}`);
  }
};
