import { describe, it, expect } from "vitest";
import {
  isValidPaidPlan,
  getPlan,
  getDisplayPrice,
  hasActiveSubscription,
  PAID_PLAN_KEYS,
} from "./plans.js";

describe("PAID_PLAN_KEYS", () => {
  it("contains lite, growth, scale", () => {
    expect(PAID_PLAN_KEYS).toContain("lite");
    expect(PAID_PLAN_KEYS).toContain("growth");
    expect(PAID_PLAN_KEYS).toContain("scale");
  });
  it("does not contain free", () => {
    expect(PAID_PLAN_KEYS).not.toContain("free");
  });
});

describe("isValidPaidPlan", () => {
  it("accepts valid plan + interval combos", () => {
    expect(isValidPaidPlan("lite", "monthly")).toBe(true);
    expect(isValidPaidPlan("growth", "annual")).toBe(true);
    expect(isValidPaidPlan("scale", "monthly")).toBe(true);
  });
  it("rejects free plan", () => {
    expect(isValidPaidPlan("free", "monthly")).toBe(false);
  });
  it("rejects unknown plan", () => {
    expect(isValidPaidPlan("unknown", "monthly")).toBe(false);
  });
  it("rejects invalid interval", () => {
    expect(isValidPaidPlan("lite", "weekly")).toBe(false);
    expect(isValidPaidPlan("lite", "")).toBe(false);
  });
});

describe("getPlan", () => {
  it("returns plan object for valid key", () => {
    const plan = getPlan("lite");
    expect(plan).not.toBeNull();
    expect(plan.key).toBe("lite");
    expect(typeof plan.monthlyPrice).toBe("number");
  });
  it("returns null for unknown key", () => {
    expect(getPlan("unknown")).toBeNull();
    expect(getPlan("")).toBeNull();
  });
});

describe("getDisplayPrice", () => {
  it("returns monthly price as £N string", () => {
    const result = getDisplayPrice("lite", "monthly");
    expect(result).toMatch(/^£\d+$/);
    expect(result).toBe("£19");
  });
  it("returns discounted annual price (20% off)", () => {
    const plan = getPlan("lite");
    const expected = `£${Math.round(plan.monthlyPrice * 0.8)}`;
    expect(getDisplayPrice("lite", "annual")).toBe(expected);
  });
  it("returns null for unknown plan", () => {
    expect(getDisplayPrice("unknown", "monthly")).toBeNull();
  });
});

describe("hasActiveSubscription", () => {
  it("returns true for active subscription", () => {
    expect(hasActiveSubscription({
      stripe_subscription_id: "sub_123",
      subscription_status: "active",
    })).toBe(true);
  });
  it("returns true for trialing", () => {
    expect(hasActiveSubscription({
      stripe_subscription_id: "sub_123",
      subscription_status: "trialing",
    })).toBe(true);
  });
  it("returns false without subscription id", () => {
    expect(hasActiveSubscription({
      stripe_subscription_id: null,
      subscription_status: "active",
    })).toBe(false);
  });
  it("returns false for cancelled status", () => {
    expect(hasActiveSubscription({
      stripe_subscription_id: "sub_123",
      subscription_status: "canceled",
    })).toBe(false);
  });
  it("returns false for null profile", () => {
    expect(hasActiveSubscription(null)).toBe(false);
  });
});
