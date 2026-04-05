import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  getStatusLabel,
  getStatusColor,
  MOCK_CATEGORIES,
  MOCK_PROVIDERS,
} from "./mockData";

describe("formatCurrency", () => {
  it("formats whole dollar amounts without decimals", () => {
    expect(formatCurrency(85)).toBe("$85");
  });

  it("formats larger amounts", () => {
    expect(formatCurrency(1500)).toBe("$1,500");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });
});

describe("getStatusLabel", () => {
  it("returns correct label for pending", () => {
    expect(getStatusLabel("pending")).toBe("Pending");
  });

  it("returns correct label for in_progress", () => {
    expect(getStatusLabel("in_progress")).toBe("In Progress");
  });

  it("returns correct label for en_route", () => {
    expect(getStatusLabel("en_route")).toBe("En Route");
  });

  it("returns the status itself for unknown values", () => {
    expect(getStatusLabel("unknown_status")).toBe("unknown_status");
  });
});

describe("getStatusColor", () => {
  it("returns a hex color string for known statuses", () => {
    const color = getStatusColor("completed");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns fallback color for unknown status", () => {
    expect(getStatusColor("unknown")).toBe("#6b7280");
  });
});

describe("MOCK_CATEGORIES", () => {
  it("has at least 5 categories", () => {
    expect(MOCK_CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it("each category has id, name, and icon", () => {
    MOCK_CATEGORIES.forEach((cat) => {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    });
  });
});

describe("MOCK_PROVIDERS", () => {
  it("has at least 4 providers", () => {
    expect(MOCK_PROVIDERS.length).toBeGreaterThanOrEqual(4);
  });

  it("each provider has required fields", () => {
    MOCK_PROVIDERS.forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.rating).toBeGreaterThan(0);
      expect(p.hourlyRate).toBeGreaterThan(0);
    });
  });
});
