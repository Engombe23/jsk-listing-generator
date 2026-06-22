import { supabaseAdmin, supabaseAdminReady } from "./supabaseAdmin.js";
import { stripe } from "./stripeConfig.js";

const TERMINAL_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired"]);
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

function stripeId(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id || null;
}

function planFromMetadata(metadata) {
  const plan = metadata?.plan;
  return plan && plan !== "free" ? plan : null;
}

function resolvePlan({ metadata, status }) {
  if (TERMINAL_STATUSES.has(status)) return "free";
  const metaPlan = planFromMetadata(metadata);
  if (metaPlan) return metaPlan;
  if (ACTIVE_STATUSES.has(status)) return null;
  return null;
}

async function upsertProfile(userId, fields) {
  if (!supabaseAdminReady) {
    throw new Error(
      "Supabase admin client is not configured — set SUPABASE_SERVICE_ROLE_KEY in backend/.env"
    );
  }
  if (!userId) {
    throw new Error("userId is required for profile upsert");
  }

  const payload = {
    id: userId,
    updated_at: new Date().toISOString(),
    ...fields,
  };

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(`profile upsert failed: ${error.message}`);
  }
}

export async function applyCheckoutSession(session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  if (!userId) {
    throw new Error("checkout session missing userId (client_reference_id / metadata.userId)");
  }

  const plan = planFromMetadata(session.metadata);
  if (!plan) {
    throw new Error(`checkout session missing valid plan metadata (got: ${session.metadata?.plan || "none"})`);
  }

  const interval = session.metadata?.interval || null;
  const subscription = session.subscription;
  const subscriptionStatus =
    typeof subscription === "object" && subscription?.status
      ? subscription.status
      : "active";

  await upsertProfile(userId, {
    plan,
    stripe_customer_id: stripeId(session.customer),
    stripe_subscription_id: stripeId(session.subscription),
    subscription_status: subscriptionStatus,
    billing_interval: interval,
  });

  return { userId, plan, interval };
}

export async function applySubscription(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.warn("[stripe] subscription event missing metadata.userId — skipping");
    return null;
  }

  const status = subscription.status;
  const plan = resolvePlan({ metadata: subscription.metadata, status });
  const fields = {
    stripe_customer_id: stripeId(subscription.customer),
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    billing_interval: subscription.metadata?.interval || null,
  };

  if (plan) {
    fields.plan = plan;
  } else if (TERMINAL_STATUSES.has(status)) {
    fields.plan = "free";
  }

  await upsertProfile(userId, fields);
  return { userId, plan: fields.plan, status };
}

export async function syncCheckoutSession(sessionId, expectedUserId) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  if (!sessionId) {
    throw new Error("sessionId is required");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const userId = session.client_reference_id || session.metadata?.userId;
  if (!userId || userId !== expectedUserId) {
    throw new Error("Checkout session does not belong to this user");
  }

  if (session.mode !== "subscription") {
    throw new Error("Checkout session is not a subscription");
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    throw new Error(`Checkout not complete (status=${session.status}, payment_status=${session.payment_status})`);
  }

  return applyCheckoutSession(session);
}

export async function handleCheckoutSessionCompleted(session) {
  return applyCheckoutSession(session);
}

export async function handleSubscriptionChange(subscription) {
  return applySubscription(subscription);
}

export async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionChange(event.data.object);
      break;
    default:
      break;
  }
}
