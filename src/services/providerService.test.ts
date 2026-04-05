import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _type: "serverTimestamp" })),
}));

import {
  getProviders,
  getProviderById,
  createServiceRequest,
  getUserBookmarks,
  addBookmark,
} from "./providerService";

import {
  getDocs,
  getDoc,
  addDoc,
} from "firebase/firestore";

import type { ServiceProvider, ServiceRequest } from "../types";

const mockProvider: ServiceProvider = {
  id: "p1",
  name: "Marcus Rivera",
  category: "plumbing",
  rating: 5.0,
  reviewCount: 148,
  hourlyRate: 85,
  available: true,
  location: "Brooklyn, NY",
  distanceMiles: 1.2,
  imageUrl: "https://example.com/img.jpg",
  specialties: ["Leak Repair"],
};

const makeDocs = (items: Record<string, unknown>[]) => ({
  docs: items.map((data, i) => ({
    id: `id-${i}`,
    data: () => data,
  })),
});

describe("getProviders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mapped providers from Firestore", async () => {
    vi.mocked(getDocs).mockResolvedValueOnce(
      makeDocs([{ ...mockProvider, id: undefined }]) as never
    );
    const result = await getProviders();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Marcus Rivera");
  });

  it("throws a readable error when Firestore fails", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("quota exceeded"));
    await expect(getProviders()).rejects.toThrow("Failed to fetch providers");
  });
});

describe("getProviderById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns provider when document exists", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: "p1",
      data: () => ({ ...mockProvider, id: undefined }),
    } as never);
    const result = await getProviderById("p1");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Marcus Rivera");
  });

  it("returns null when document does not exist", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as never);
    const result = await getProviderById("nonexistent");
    expect(result).toBeNull();
  });

  it("throws when Firestore fails", async () => {
    vi.mocked(getDoc).mockRejectedValueOnce(new Error("network error"));
    await expect(getProviderById("p1")).rejects.toThrow("Failed to fetch provider");
  });
});

describe("createServiceRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns new document id on success", async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "req-abc" } as never);
    const request: Omit<ServiceRequest, "id" | "createdAt" | "updatedAt"> = {
      userId: "u1",
      providerId: "p1",
      categoryId: "plumbing",
      description: "Burst pipe",
      status: "pending",
      address: "123 Main St",
    };
    const id = await createServiceRequest(request);
    expect(id).toBe("req-abc");
  });

  it("throws when addDoc fails", async () => {
    vi.mocked(addDoc).mockRejectedValueOnce(new Error("write error"));
    await expect(
      createServiceRequest({
        userId: "u1",
        providerId: "p1",
        categoryId: "plumbing",
        description: "test",
        status: "pending",
        address: "123 Main St",
      })
    ).rejects.toThrow("Failed to create request");
  });
});

describe("addBookmark", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the new bookmark document id", async () => {
    vi.mocked(addDoc).mockResolvedValueOnce({ id: "bm-xyz" } as never);
    const id = await addBookmark("user-1", "provider-1");
    expect(id).toBe("bm-xyz");
  });

  it("throws a readable error when Firestore fails", async () => {
    vi.mocked(addDoc).mockRejectedValueOnce(new Error("permission denied"));
    await expect(addBookmark("user-1", "provider-1")).rejects.toThrow("Failed to add bookmark");
  });
});

describe("getUserBookmarks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mapped bookmarks with converted dates", async () => {
    const fakeDate = { toDate: () => new Date("2026-01-01") };
    vi.mocked(getDocs).mockResolvedValueOnce(
      makeDocs([{ userId: "u1", providerId: "p1", createdAt: fakeDate }]) as never
    );
    const result = await getUserBookmarks("u1");
    expect(result).toHaveLength(1);
    expect(result[0].providerId).toBe("p1");
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});
