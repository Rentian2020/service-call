import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProviders } from "./useProviders";
import type { ServiceProvider } from "../types";

vi.mock("../services/providerService", () => ({
  getProviders: vi.fn(),
}));

import { getProviders } from "../services/providerService";

const mockProviders: ServiceProvider[] = [
  {
    id: "1",
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
  },
];

describe("useProviders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns providers on success", async () => {
    vi.mocked(getProviders).mockResolvedValueOnce(mockProviders);
    const { result } = renderHook(() => useProviders());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.providers).toHaveLength(1);
    expect(result.current.providers[0].name).toBe("Marcus Rivera");
    expect(result.current.error).toBeNull();
  });

  it("returns error message on failure", async () => {
    vi.mocked(getProviders).mockRejectedValueOnce(new Error("network error"));
    const { result } = renderHook(() => useProviders());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.providers).toHaveLength(0);
    expect(result.current.error).toBe("network error");
  });

  it("passes categoryId to getProviders", async () => {
    vi.mocked(getProviders).mockResolvedValueOnce([]);
    renderHook(() => useProviders("plumbing"));

    await waitFor(() =>
      expect(getProviders).toHaveBeenCalledWith("plumbing")
    );
  });

  it("refetches when categoryId changes", async () => {
    vi.mocked(getProviders).mockResolvedValue([]);
    const { rerender } = renderHook(({ cat }) => useProviders(cat), {
      initialProps: { cat: "plumbing" },
    });

    await waitFor(() => expect(getProviders).toHaveBeenCalledTimes(1));

    rerender({ cat: "electricity" });

    await waitFor(() => expect(getProviders).toHaveBeenCalledTimes(2));
    expect(getProviders).toHaveBeenLastCalledWith("electricity");
  });
});
