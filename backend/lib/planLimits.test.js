import { describe, it, expect } from "vitest";
import {
  isWhitelisted,
  listingLimitForPlan,
  isUnlimited,
  planRank,
  planMeetsTier,
  hasPlanFeature,
} from "./planLimits.js";

describe("isWhitelisted", () => {
  it("recognises admin emails", () => {
    expect(isWhitelisted("aaron@partlister.app")).toBe(true);
    expect(isWhitelisted("engombe@partlister.app")).toBe(true);
  });
  it("rejects unknown emails", () => {
    expect(isWhitelisted("user@example.com")).toBe(false);
    expect(isWhitelisted("")).toBe(false);
    expect(isWhitelisted(null)).toBe(false);
  });
  it("is case-insensitive", () => {
    expect(isWhitelisted("AARON@PARTLISTER.APP")).toBe(true);
    expect(isWhitelisted("Aaron@PartLister.App")).toBe(true);
  });
});

describe("listingLimitForPlan", () => {
  it("returns 10 for free", () => expect(listingLimitForPlan("free")).toBe(10));
  it("returns 50 for lite", () => expect(listingLimitForPlan("lite")).toBe(50));
  it("returns 200 for growth", () => expect(listingLimitForPlan("growth")).toBe(200));
  it("returns null (unlimited) for scale", () => expect(listingLimitForPlan("scale")).toBeNull());
  it("defaults to 0 for unknown plan", () => expect(listingLimitForPlan("unknown")).toBe(0));
  it("defaults to 0 for undefined", () => expect(listingLimitForPlan(undefined)).toBe(0));
});

describe("isUnlimited", () => {
  it("returns true for null", () => expect(isUnlimited(null)).toBe(true));
  it("returns true for -1", () => expect(isUnlimited(-1)).toBe(true));
  it("returns false for a number", () => expect(isUnlimited(200)).toBe(false));
  it("returns false for 0", () => expect(isUnlimited(0)).toBe(false));
});

describe("planRank", () => {
  it("ranks plans in ascending order", () => {
    expect(planRank("free")).toBeLessThan(planRank("lite"));
    expect(planRank("lite")).toBeLessThan(planRank("growth"));
    expect(planRank("growth")).toBeLessThan(planRank("scale"));
  });
  it("returns 0 for unknown plans", () => {
    expect(planRank("unknown")).toBe(0);
  });
});

describe("planMeetsTier", () => {
  it("same tier always passes", () => {
    expect(planMeetsTier("growth", "growth")).toBe(true);
  });
  it("higher tier passes lower requirement", () => {
    expect(planMeetsTier("scale", "growth")).toBe(true);
  });
  it("lower tier fails higher requirement", () => {
    expect(planMeetsTier("lite", "growth")).toBe(false);
    expect(planMeetsTier("free", "scale")).toBe(false);
  });
});

describe("hasPlanFeature", () => {
  it("growth has compatibilityChecker", () => {
    expect(hasPlanFeature("growth", "compatibilityChecker")).toBe(true);
  });
  it("lite does not have compatibilityChecker", () => {
    expect(hasPlanFeature("lite", "compatibilityChecker")).toBe(false);
  });
  it("scale has bulkCsvExport", () => {
    expect(hasPlanFeature("scale", "bulkCsvExport")).toBe(true);
  });
  it("growth does not have bulkCsvExport", () => {
    expect(hasPlanFeature("growth", "bulkCsvExport")).toBe(false);
  });
  it("returns false for unknown feature", () => {
    expect(hasPlanFeature("scale", "nonExistentFeature")).toBe(false);
  });
});
