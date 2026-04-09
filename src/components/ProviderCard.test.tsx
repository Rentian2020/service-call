import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "../hooks/useAppContext";
import { AuthProvider } from "../hooks/useAuth";
import { ProviderCard } from "./ProviderCard";
import type { ServiceProvider } from "../types";

const mockProvider: ServiceProvider = {
  id: "1",
  name: "Joe's Plumbing",
  businessName: "Joe's Plumbing",
  category: "plumbing",
  rating: 4.8,
  reviewCount: 50,
  inspectionFee: 75,
  available: true,
  location: "Brooklyn, NY",
  distanceMiles: 1.2,
  imageUrl: "https://via.placeholder.com/400",
  specialties: ["Leak Repair"],
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>
      <AppProvider>{children}</AppProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe("ProviderCard", () => {
  it("renders provider name", () => {
    render(
      <Wrapper>
        <ProviderCard
          provider={mockProvider}
          isBookmarked={false}
          onBookmark={() => {}}
          onClick={() => {}}
        />
      </Wrapper>
    );
    expect(screen.getByText("Joe's Plumbing")).toBeTruthy();
  });

  it("renders category", () => {
    render(
      <Wrapper>
        <ProviderCard
          provider={mockProvider}
          isBookmarked={false}
          onBookmark={() => {}}
          onClick={() => {}}
        />
      </Wrapper>
    );
    expect(screen.getByText("plumbing")).toBeTruthy();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <Wrapper>
        <ProviderCard
          provider={mockProvider}
          isBookmarked={false}
          onBookmark={() => {}}
          onClick={onClick}
        />
      </Wrapper>
    );
    screen.getByText("Joe's Plumbing").click();
    expect(onClick).toHaveBeenCalledWith(mockProvider);
  });

  it("does not show distance when showDistance is false", () => {
    const { container } = render(
      <Wrapper>
        <ProviderCard
          provider={{ ...mockProvider, latitude: 40.71, longitude: -74.01 }}
          isBookmarked={false}
          onBookmark={() => {}}
          onClick={() => {}}
          showDistance={false}
        />
      </Wrapper>
    );
    expect(container.textContent).not.toMatch(/mi$/);
  });

  it("shows Unrated label when provider has no reviews", () => {
    render(
      <Wrapper>
        <ProviderCard
          provider={{ ...mockProvider, reviewCount: 0 }}
          isBookmarked={false}
          onBookmark={() => {}}
          onClick={() => {}}
        />
      </Wrapper>
    );
    expect(screen.getByText("Unrated")).toBeTruthy();
  });
});
