import express from "express";
import { CLIENT_URL, resolvePriceId, stripe, stripeReady } from "../lib/stripeConfig.js";
import {
  handleStripeWebhookEvent,
  syncCheckoutSession,
  upgradeSubscription,
} from "../lib/stripeBilling.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const router = express.Router();

function requireStripe(_req, res, next) {
  if (!stripeReady) {
    return res.status(503).json({ error: "Stripe is not configured" });
  }
  next();
}

// Diagnostic: tells clients what's set without exposing keys
router.get("/stripe/status", (_req, res) => {
  const priceIds = {
    lite_monthly: !!process.env.MONTHLY_PRICE_ID_LITE,
    growth_monthly: !!process.env.MONTHLY_PRICE_ID_GROWTH,
    scale_monthly: !!process.env.MONTHLY_PRICE_ID_SCALE,
    lite_annual: !!process.env.ANNUAL_PRICE_ID_LITE,
    growth_annual: !!process.env.ANNUAL_PRICE_ID_GROWTH,
    scale_annual: !!process.env.ANNUAL_PRICE_ID_SCALE,
  };
  res.json({
    stripe_ready: stripeReady,
    client_url_set: !!CLIENT_URL,
    client_url: CLIENT_URL,
    price_ids: priceIds,
    all_monthly_set: priceIds.lite_monthly && priceIds.growth_monthly && priceIds.scale_monthly,
  });
});

router.post("/stripe/create-checkout-session", requireStripe, requireAuth, async (req, res) => {
  try {
    const { plan, interval = "monthly" } = req.body || {};
    const userId = req.user.id;
    const email  = req.user.email;

    const priceId = resolvePriceId(plan, interval);
    if (!priceId) {
      console.error(`[/api/stripe/create-checkout-session] No price ID for plan="${plan}" interval="${interval}". Set MONTHLY_PRICE_ID_${plan?.toUpperCase()} on Render.`);
      return res.status(400).json({ error: `Price not configured for ${plan} plan. Contact support.` });
    }

    if (!CLIENT_URL) {
      console.error("[/api/stripe/create-checkout-session] CLIENT_URL is not set — set it to https://partlister.app on Render.");
      return res.status(503).json({ error: "Checkout is misconfigured (CLIENT_URL missing). Contact support." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${CLIENT_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/pricing`,
      client_reference_id: userId,
      customer_email: email || undefined,
      metadata: { userId, plan, interval },
      subscription_data: {
        metadata: { userId, plan, interval },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[/api/stripe/create-checkout-session]", err.message, err.type || "");
    res.status(500).json({ error: `Checkout failed: ${err.message}` });
  }
});

router.post("/stripe/upgrade-subscription", requireStripe, requireAuth, async (req, res) => {
  try {
    const { plan, interval = "monthly" } = req.body || {};
    const userId = req.user.id;

    const result = await upgradeSubscription({ userId, plan, interval });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[/api/stripe/upgrade-subscription]", err.message);
    const status = err.message.includes("No active subscription") ||
      err.message.includes("must be higher") ||
      err.message.includes("Invalid plan") ||
      err.message.includes("Billing interval")
      ? 400
      : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post("/stripe/sync-checkout", requireStripe, requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    const userId = req.user.id;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const result = await syncCheckoutSession(sessionId, userId);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[/api/stripe/sync-checkout]", err.message);
    res.status(500).json({ error: "Checkout sync failed." });
  }
});

router.post("/stripe/create-portal-session", requireStripe, requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error || !profile?.stripe_customer_id) {
      return res.status(400).json({ error: "No billing account found for this user." });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${CLIENT_URL}/?billing=1`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[/api/stripe/create-portal-session]", err.message);
    res.status(500).json({ error: "Billing portal session creation failed." });
  }
});

export function registerStripeWebhook(app) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      if (!stripeReady) {
        return res.status(503).send("Stripe is not configured");
      }

      const sig = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("[/api/stripe/webhook] verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        await handleStripeWebhookEvent(event);
        console.log("[/api/stripe/webhook]", event.type);
        res.json({ received: true });
      } catch (err) {
        console.error("[/api/stripe/webhook] handler failed:", err.message, err.stack || "");
        res.status(500).json({ error: err.message });
      }
    }
  );
}

export default router;
