import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders with default placeholder", () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("Search services, providers...")
    ).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<SearchBar placeholder="Find a plumber..." onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText("Find a plumber...")).toBeInTheDocument();
  });

  it("calls onSearch with input value", () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "plumbing" } });
    expect(handleSearch).toHaveBeenCalledWith("plumbing");
  });

  it("renders filter button", () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
  });
});