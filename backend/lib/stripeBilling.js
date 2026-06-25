import { supabaseAdmin, supabaseAdminReady } from "./supabaseAdmin.js";
import { resolvePriceId, stripe } from "./stripeConfig.js";

const TERMINAL_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired"]);
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
const PAID_PLANS = new Set(["lite", "growth", "scale"]);
const BILLING_INTERVALS = new Set(["monthly", "annual"]);
const PLAN_RANK = { free: 0, lite: 1, growth: 2, scale: 3 };

function planRank(plan) {
  return PLAN_RANK[plan] ?? 0;
}

export function hasActiveSubscription(profile) {
  return Boolean(
    profile?.stripe_subscription_id &&
    ACTIVE_STATUSES.has(profile.subscription_status)
  );
}

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

export async function getBillingProfile(userId) {
  if (!supabaseAdminReady) {
    throw new Error(
      "Supabase admin client is not configured — set SUPABASE_SERVICE_ROLE_KEY in backend/.env"
    );
  }
  if (!userId) {
    throw new Error("userId is required");
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("plan, stripe_customer_id, stripe_subscription_id, subscription_status, billing_interval")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`profile fetch failed: ${error.message}`);
  }

  return data;
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

export async function upgradeSubscription({ userId, plan, interval = "monthly" }) {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  if (!userId) {
    throw new Error("userId is required");
  }
  if (!PAID_PLANS.has(plan) || !BILLING_INTERVALS.has(interval)) {
    throw new Error("Invalid plan or billing interval");
  }

  const profile = await getBillingProfile(userId);
  if (!hasActiveSubscription(profile)) {
    throw new Error("No active subscription to upgrade");
  }

  const currentPlan = profile.plan || "free";
  if (planRank(plan) <= planRank(currentPlan)) {
    throw new Error("Target plan must be higher than your current plan");
  }

  const billingInterval = profile.billing_interval || interval;
  if (billingInterval !== interval) {
    throw new Error(
      `Billing interval must match your current subscription (${billingInterval})`
    );
  }

  const priceId = resolvePriceId(plan, billingInterval);
  if (!priceId) {
    throw new Error("Price is not configured for this plan and interval");
  }

  const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
  const ownerId = subscription.metadata?.userId;
  if (ownerId && ownerId !== userId) {
    throw new Error("Subscription does not belong to this user");
  }

  const itemId = subscription.items?.data?.[0]?.id;
  if (!itemId) {
    throw new Error("Subscription has no billable items");
  }

  const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: "create_prorations",
    metadata: { userId, plan, interval: billingInterval },
  });

  await upsertProfile(userId, {
    plan,
    billing_interval: billingInterval,
    subscription_status: updated.status,
    stripe_customer_id: stripeId(updated.customer),
    stripe_subscription_id: updated.id,
  });

  return { userId, plan, interval: billingInterval, subscriptionId: updated.id };
}
