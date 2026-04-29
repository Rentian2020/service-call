import { type User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

const USERS = "users";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  lastSignInAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  primaryAuth: string;
  accountExistsInFirestore: boolean;
};

const tsToDate = (v: unknown): Date | null => {
  if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    return (v as { toDate: () => Date }).toDate();
  }
  return null;
};

export const syncUserProfile = async (firebaseUser: FirebaseUser): Promise<void> => {
  if (!isFirebaseConfigured) return;
  const ref = doc(db, USERS, firebaseUser.uid);
  const primaryAuth = firebaseUser.providerData[0]?.providerId ?? "password";
  const existing = await getDoc(ref);
  const nowFields = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? null,
    email: firebaseUser.email ?? null,
    emailVerified: firebaseUser.emailVerified,
    photoURL: firebaseUser.photoURL ?? null,
    lastSignInAt: firebaseUser.metadata.lastSignInTime
      ? Timestamp.fromDate(new Date(firebaseUser.metadata.lastSignInTime))
      : null,
    updatedAt: serverTimestamp(),
    primaryAuth,
  };
  if (!existing.exists) {
    await setDoc(ref, {
      ...nowFields,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, nowFields);
  }
};

export const updateUserLastKnownLocation = async (
  uid: string,
  location: { label: string; lat: number; lng: number }
): Promise<void> => {
  if (!isFirebaseConfigured) return;
  const ref = doc(db, USERS, uid);
  const existing = await getDoc(ref);
  if (!existing.exists) return;
  await updateDoc(ref, {
    lastKnownLocationLabel: location.label,
    lastKnownLat: location.lat,
    lastKnownLng: location.lng,
    updatedAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists) return null;
  const d = snap.data() as Record<string, unknown>;
  return {
    uid: snap.id,
    email: (d.email as string) ?? null,
    displayName: (d.displayName as string) ?? null,
    photoURL: (d.photoURL as string) ?? null,
    emailVerified: Boolean(d.emailVerified),
    lastSignInAt: tsToDate(d.lastSignInAt),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    primaryAuth: (d.primaryAuth as string) ?? "unknown",
    accountExistsInFirestore: true,
  };
};
