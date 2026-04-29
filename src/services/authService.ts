import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { syncUserProfile } from "./userProfileService";
import type { User } from "../types";

const LOCAL_USER_KEY = "servicecall_local_user";
const LOCAL_ACCOUNTS_KEY = "servicecall_local_accounts";

type LocalAccount = {
  uid: string;
  name: string;
  email: string;
  password: string;
};

const readLocalUser = (): User | null => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const writeLocalUser = (user: User | null) => {
  try {
    if (!user) localStorage.removeItem(LOCAL_USER_KEY);
    else localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("servicecall-auth-changed"));
  } catch {
    // ignore localStorage failures in restricted environments
  }
};

const readLocalAccounts = (): LocalAccount[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccount[]) : [];
  } catch {
    return [];
  }
};

const writeLocalAccounts = (accounts: LocalAccount[]) => {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore localStorage failures in restricted environments
  }
};

const formatAuthError = (error: unknown): string => {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    if (code === "auth/email-already-in-use") {
      return "This email is already registered. Use Sign in or Google.";
    }
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/invalid-login-credentials") {
      return "Invalid email or password.";
    }
    if (code === "auth/user-not-found") {
      return "No account for this email. Create an account first.";
    }
    if (code === "auth/weak-password") {
      return "Use a stronger password (at least 6 characters).";
    }
    if (code === "auth/too-many-requests") {
      return "Too many attempts. Try again in a few minutes.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Sign in was cancelled.";
    }
  }
  if (error instanceof Error) return error.message;
  return "Authentication failed.";
};

export const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  displayName: firebaseUser.displayName,
  email: firebaseUser.email,
  photoURL: firebaseUser.photoURL,
});

export const signInWithGoogle = async (): Promise<User> => {
  if (!isFirebaseConfigured) {
    const localGoogleUser: User = {
      uid: "local-google-user",
      displayName: "Local User",
      email: "local.user@example.com",
      photoURL: null,
    };
    writeLocalUser(localGoogleUser);
    return localGoogleUser;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return mapFirebaseUser(result.user);
  } catch (error) {
    throw new Error(`Sign in failed: ${formatAuthError(error)}`);
  }
};

export const signOut = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    writeLocalUser(null);
    return;
  }
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(`Sign out failed: ${error}`);
  }
};

export const signUpWithEmail = async (name: string, email: string, password: string): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (isFirebaseConfigured) {
    const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
    if (methods.length > 0) {
      const withGoogle = methods.includes("google.com");
      throw new Error(
        withGoogle
          ? "This email is already registered with Google. Use “Sign in with Google” or a different email."
          : "An account already exists with this email. Use Sign in instead."
      );
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
        await cred.user.reload();
      }
      const refreshed = cred.user;
      await syncUserProfile(refreshed);
      return mapFirebaseUser(refreshed);
    } catch (e) {
      throw new Error(formatAuthError(e));
    }
  }
  const existing = readLocalAccounts();
  if (existing.some((a) => a.email === normalizedEmail)) {
    throw new Error("An account already exists with that email.");
  }
  const newAccount: LocalAccount = {
    uid: `local-${Date.now()}`,
    name: name.trim() || "User",
    email: normalizedEmail,
    password,
  };
  writeLocalAccounts([newAccount, ...existing]);
  const user: User = {
    uid: newAccount.uid,
    displayName: newAccount.name,
    email: newAccount.email,
    photoURL: null,
  };
  writeLocalUser(user);
  return user;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (isFirebaseConfigured) {
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await syncUserProfile(cred.user);
      return mapFirebaseUser(cred.user);
    } catch (e) {
      throw new Error(formatAuthError(e));
    }
  }
  const account = readLocalAccounts().find((a) => a.email === normalizedEmail);
  if (!account || account.password !== password) {
    throw new Error("Invalid email or password.");
  }
  const user: User = {
    uid: account.uid,
    displayName: account.name,
    email: account.email,
    photoURL: null,
  };
  writeLocalUser(user);
  return user;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!isFirebaseConfigured) {
    callback(readLocalUser());
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_USER_KEY) callback(readLocalUser());
    };
    const onLocalAuthChange = () => callback(readLocalUser());
    window.addEventListener("storage", onStorage);
    window.addEventListener("servicecall-auth-changed", onLocalAuthChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("servicecall-auth-changed", onLocalAuthChange);
    };
  }
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    void syncUserProfile(firebaseUser)
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.error("[ServiceCall] syncUserProfile failed (check Firestore rules + deploy):", err);
        }
      })
      .finally(() => {
        callback(mapFirebaseUser(firebaseUser));
      });
  });
};
