import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProviderCard } from "./ProviderCard";
import type { ServiceProvider } from "../types";

const mockProvider: ServiceProvider = {
  id: "test-1",
  name: "Marcus Rivera",
  category: "plumbing",
  rating: 5.0,
  reviewCount: 148,
  hourlyRate: 85,
  available: true,
  location: "Brooklyn, NY",
  distanceMiles: 1.2,
  imageUrl: "https://example.com/image.jpg",
  specialties: ["Leak Repair", "Pipe Installation"],
};

describe("ProviderCard", () => {
  it("renders provider name and category", () => {
    render(<ProviderCard provider={mockProvider} onClick={vi.fn()} />);
    expect(screen.getByText("Marcus Rivera")).toBeInTheDocument();
    expect(screen.getByText("plumbing")).toBeInTheDocument();
  });

  it("renders rating correctly", () => {
    render(<ProviderCard provider={mockProvider} onClick={vi.fn()} />);
    expect(screen.getByText("5.0")).toBeInTheDocument();
  });

  it("shows Available badge when provider is available", () => {
    render(<ProviderCard provider={mockProvider} onClick={vi.fn()} />);
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("shows Busy badge when provider is not available", () => {
    const busyProvider = { ...mockProvider, available: false };
    render(<ProviderCard provider={busyProvider} onClick={vi.fn()} />);
    expect(screen.getByText("Busy")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const handleClick = vi.fn();
    render(<ProviderCard provider={mockProvider} onClick={handleClick} />);
    fireEvent.click(screen.getByText("Marcus Rivera").closest("div")!);
    expect(handleClick).toHaveBeenCalledWith(mockProvider);
  });

  it("calls onBookmark when bookmark button is clicked", () => {
    const handleBookmark = vi.fn();
    render(
      <ProviderCard
        provider={mockProvider}
        onBookmark={handleBookmark}
        onClick={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /bookmark/i }));
    expect(handleBookmark).toHaveBeenCalledWith("test-1");
  });

  it("shows bookmarked state when isBookmarked is true", () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isBookmarked={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /remove bookmark/i })).toBeInTheDocument();
  });

  it("renders hourly rate in full (non-compact) mode", () => {
    render(<ProviderCard provider={mockProvider} onClick={vi.fn()} compact={false} />);
    expect(screen.getByText("$85/hr")).toBeInTheDocument();
  });
});
