import Stripe from "stripe";

export const stripe = process.env.STRIPE_API_KEY
  ? new Stripe(process.env.STRIPE_API_KEY)
  : null;

export const stripeReady = !!stripe;

export const CLIENT_URL =
  process.env.CLIENT_URL ||
  process.env.VITE_CLIENT_URL;

export const PRICE_IDS = {
  lite: {
    monthly: process.env.MONTHLY_PRICE_ID_LITE,
    annual: process.env.ANNUAL_PRICE_ID_LITE,
  },
  growth: {
    monthly: process.env.MONTHLY_PRICE_ID_GROWTH,
    annual: process.env.ANNUAL_PRICE_ID_GROWTH,
  },
  scale: {
    monthly: process.env.MONTHLY_PRICE_ID_SCALE,
    annual: process.env.ANNUAL_PRICE_ID_SCALE,
  },
};

export function resolvePriceId(plan, interval = "monthly") {
  return PRICE_IDS[plan]?.[interval] || null;
}
