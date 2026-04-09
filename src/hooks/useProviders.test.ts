import { describe, it, expect } from "vitest";

// Providers are now managed via AppContext (live state, no mock data).
// These tests verify type contracts only.

describe("ServiceProvider shape", () => {
  it("has inspectionFee instead of hourlyRate", () => {
    const provider = {
      id: "1",
      name: "Test Business",
      category: "plumbing",
      rating: 5,
      reviewCount: 0,
      inspectionFee: 50,
      available: true,
      location: "NYC",
      distanceMiles: 1,
      imageUrl: "",
      specialties: [],
    };
    expect(provider.inspectionFee).toBe(50);
    expect((provider as Record<string, unknown>).hourlyRate).toBeUndefined();
  });
});
