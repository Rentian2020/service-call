import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User as FirebaseUser } from "firebase/auth";

vi.mock("./firebase", () => ({
  auth: {},
  googleProvider: {},
}));

vi.mock("firebase/auth", () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

import { signInWithGoogle, signOut, mapFirebaseUser, onAuthChange } from "./authService";
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";

const mockFirebaseUser: FirebaseUser = {
  uid: "uid-123",
  displayName: "Jane Doe",
  email: "jane@example.com",
  photoURL: "https://example.com/photo.jpg",
} as FirebaseUser;

describe("mapFirebaseUser", () => {
  it("maps firebase user fields to app User interface", () => {
    const result = mapFirebaseUser(mockFirebaseUser);
    expect(result).toEqual({
      uid: "uid-123",
      displayName: "Jane Doe",
      email: "jane@example.com",
      photoURL: "https://example.com/photo.jpg",
    });
  });

  it("handles null displayName and photoURL", () => {
    const user = { ...mockFirebaseUser, displayName: null, photoURL: null };
    const result = mapFirebaseUser(user as FirebaseUser);
    expect(result.displayName).toBeNull();
    expect(result.photoURL).toBeNull();
  });
});

describe("signInWithGoogle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mapped user on successful sign in", async () => {
    vi.mocked(signInWithPopup).mockResolvedValueOnce({ user: mockFirebaseUser } as never);
    const user = await signInWithGoogle();
    expect(user.uid).toBe("uid-123");
    expect(user.email).toBe("jane@example.com");
  });

  it("throws an error when sign in fails", async () => {
    vi.mocked(signInWithPopup).mockRejectedValueOnce(new Error("popup closed"));
    await expect(signInWithGoogle()).rejects.toThrow("Sign in failed");
  });
});

describe("signOut", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls firebase signOut", async () => {
    vi.mocked(firebaseSignOut).mockResolvedValueOnce(undefined);
    await signOut();
    expect(firebaseSignOut).toHaveBeenCalledOnce();
  });

  it("throws when firebase signOut fails", async () => {
    vi.mocked(firebaseSignOut).mockRejectedValueOnce(new Error("network error"));
    await expect(signOut()).rejects.toThrow("Sign out failed");
  });
});

describe("onAuthChange", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls callback with mapped user when firebase user is present", () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      (cb as (u: FirebaseUser) => void)(mockFirebaseUser);
      return vi.fn();
    });
    const callback = vi.fn();
    onAuthChange(callback);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "uid-123", email: "jane@example.com" })
    );
  });

  it("calls callback with null when no firebase user", () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb) => {
      (cb as (u: null) => void)(null);
      return vi.fn();
    });
    const callback = vi.fn();
    onAuthChange(callback);
    expect(callback).toHaveBeenCalledWith(null);
  });

  it("returns the unsubscribe function", () => {
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValueOnce(unsubscribe);
    const result = onAuthChange(vi.fn());
    expect(result).toBe(unsubscribe);
  });
});
