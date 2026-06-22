import express from "express";
import { CLIENT_URL, resolvePriceId, stripe, stripeReady } from "../lib/stripeConfig.js";
import { handleStripeWebhookEvent, syncCheckoutSession } from "../lib/stripeBilling.js";

const router = express.Router();

function requireStripe(_req, res, next) {
  if (!stripeReady) {
    return res.status(503).json({ error: "Stripe is not configured" });
  }
  next();
}

router.post("/stripe/create-checkout-session", requireStripe, async (req, res) => {
  try {
    const { plan, interval = "monthly", userId, email } = req.body || {};
    if (!userId) {
      return res.status(401).json({ error: "Sign in or create an account before checkout" });
    }

    const priceId = resolvePriceId(plan, interval);
    if (!priceId) {
      return res.status(400).json({ error: "Invalid plan or billing interval" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${CLIENT_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/checkout?plan=${plan}&interval=${interval}`,
      client_reference_id: userId,
      customer_email: email || undefined,
      metadata: { userId, plan, interval },
      subscription_data: {
        metadata: { userId, plan, interval },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[/api/stripe/create-checkout-session]", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/stripe/sync-checkout", requireStripe, async (req, res) => {
  try {
    const { sessionId, userId } = req.body || {};
    if (!sessionId || !userId) {
      return res.status(400).json({ error: "sessionId and userId are required" });
    }

    const result = await syncCheckoutSession(sessionId, userId);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[/api/stripe/sync-checkout]", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/stripe/create-portal-session", requireStripe, async (req, res) => {
  try {
    const { customerId } = req.body || {};
    if (!customerId) {
      return res.status(400).json({ error: "customerId is required" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${CLIENT_URL}/?billing=1`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("[/api/stripe/create-portal-session]", err.message);
    res.status(500).json({ error: err.message });
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
