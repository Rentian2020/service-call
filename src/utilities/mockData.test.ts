import { describe, it, expect } from "vitest";
import {
  MOCK_CATEGORIES,
  formatCurrency,
  getStatusLabel,
  getStatusColor,
} from "./mockData";

describe("MOCK_CATEGORIES", () => {
  it("has at least 4 categories", () => {
    expect(MOCK_CATEGORIES.length).toBeGreaterThanOrEqual(4);
  });

  it("each category has required fields", () => {
    MOCK_CATEGORIES.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.icon).toBeTruthy();
    });
  });
});

describe("formatCurrency", () => {
  it("formats a number as USD", () => {
    expect(formatCurrency(100)).toBe("$100");
  });
});

describe("getStatusLabel", () => {
  it("returns label for known status", () => {
    expect(getStatusLabel("pending")).toBe("Pending");
    expect(getStatusLabel("completed")).toBe("Completed");
  });
  it("returns status as-is for unknown", () => {
    expect(getStatusLabel("unknown_status")).toBe("unknown_status");
  });
});

describe("getStatusColor", () => {
  it("returns a hex color for known status", () => {
    expect(getStatusColor("pending")).toMatch(/^#/);
  });
});
