import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryPill } from "./CategoryPill";
import type { ServiceCategory } from "../types";

const mockCategory: ServiceCategory = {
  id: "plumbing",
  name: "Plumbing",
  icon: "🔩",
};

describe("CategoryPill", () => {
  it("renders category name and icon", () => {
    render(<CategoryPill category={mockCategory} onClick={vi.fn()} />);
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    expect(screen.getByText("🔩")).toBeInTheDocument();
  });

  it("calls onClick with category id when clicked", () => {
    const handleClick = vi.fn();
    render(<CategoryPill category={mockCategory} onClick={handleClick} />);
    fireEvent.click(screen.getByText("Plumbing").closest("button")!);
    expect(handleClick).toHaveBeenCalledWith("plumbing");
  });

  it("applies selected styles when isSelected is true", () => {
    render(<CategoryPill category={mockCategory} isSelected={true} onClick={vi.fn()} />);
    const pill = screen.getByText("Plumbing").closest("button");
    expect(pill).toHaveClass("scale-105");
  });
});
