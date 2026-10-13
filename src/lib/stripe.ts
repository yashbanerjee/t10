import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-settings";
import { sendBookingEmails } from "@/lib/order-mail";

export type StripeConfig = { enabled: boolean; publishableKey: string; secretKey: string; webhookSecret: string; currency: string };

export async function readStripeConfig(): Promise<StripeConfig | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "stripe" } });
    const value = row?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const text = (key: string) => (typeof source[key] === "string" ? (source[key] as string).trim() : "");
    return { enabled: source.enabled === true, publishableKey: text("publishableKey"), secretKey: text("secretKey"), webhookSecret: text("webhookSecret"), currency: text("currency") || "aed" };
  } catch {
    return null;
  }
}

/** Stripe is used only when the admin has switched it on and saved a secret key. */
export async function activeStripe() {
  const config = await readStripeConfig();
  if (!config?.enabled || !config.secretKey) return null;
  return { config, stripe: new Stripe(config.secretKey) };
}

export function stripeClient(secretKey: string) {
  return new Stripe(secretKey);
}

/** Stripe wants amounts in the smallest currency unit (fils for AED). */
const toMinor = (amount: number) => Math.round(amount * 100);

export async function createCheckoutSession(orderId: string) {
  const active = await activeStripe();
  if (!active) throw new Error("STRIPE_OFF");
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  const siteUrl = await getSiteUrl();
  // Saving the card for later (saved_payment_method_options) only works when the session has a Stripe customer.
  const customer = await active.stripe.customers.create({ email: order.email, name: order.name, phone: order.phone, metadata: { orderNumber: order.number } });
  const session = await active.stripe.checkout.sessions.create({
    customer: customer.id,
    ui_mode: "hosted",
    mode: "payment",
    payment_method_types: ["card"],
    billing_address_collection: "auto",
    phone_number_collection: { enabled: true },
    automatic_tax: { enabled: false },
    allow_promotion_codes: false,
    submit_type: "auto",
    saved_payment_method_options: { payment_method_save: "enabled" },
    origin_context: "web",
    ...({ integration_identifier: "hosted_web_0001" } as Record<string, string>),
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderNumber: order.number },
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: active.config.currency,
        unit_amount: toMinor(Number(item.unitPrice)),
        product_data: { name: item.productName, ...(item.color || item.size ? { description: [item.color, item.size].filter(Boolean).join(" · ") } : {}) },
      },
    })),
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout?cancelled=${encodeURIComponent(order.id)}`,
  });
  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id, paymentMethod: "stripe" } });
  if (!session.url) throw new Error("Stripe did not return a checkout link");
  return session.url;
}

/**
 * The mobile app pays with Stripe's native PaymentSheet, so it needs a PaymentIntent instead of a hosted session.
 * Its id is kept in `stripeSessionId`; the `pi_` prefix tells the two apart.
 */
export async function createPaymentIntent(orderId: string) {
  const active = await activeStripe();
  if (!active) throw new Error("STRIPE_OFF");
  if (!active.config.publishableKey) throw new Error("Stripe publishable key is missing");
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const intent = await active.stripe.paymentIntents.create({
    amount: toMinor(Number(order.total)),
    currency: active.config.currency,
    payment_method_types: ["card"],
    receipt_email: order.email,
    description: `United Tigers order ${order.number}`,
    metadata: { orderId: order.id, orderNumber: order.number, source: "app" },
  });
  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: intent.id, paymentMethod: "stripe" } });
  if (!intent.client_secret) throw new Error("Stripe did not return a payment secret");
  return { clientSecret: intent.client_secret, publishableKey: active.config.publishableKey, currency: active.config.currency };
}

async function markOrderPaid(orderId: string, stripeReference: string) {
  const updated = await prisma.order.updateMany({ where: { id: orderId, paymentStatus: { not: "PAID" } }, data: { paymentStatus: "PAID", paidAt: new Date(), status: "CONFIRMED", stripeSessionId: stripeReference } });
  if (updated.count === 1) await sendBookingEmails(orderId).catch((error) => console.error("Order mail failed", error instanceof Error ? error.message : "unknown error"));
}

/** Marks the order paid when Stripe says the session is paid. Safe to call more than once. */
export async function confirmCheckoutSession(sessionId: string) {
  const active = await activeStripe();
  if (!active) return null;
  const session = await active.stripe.checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) return null;
  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") await markOrderPaid(orderId, session.id);
  return prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
}

/** Marks the order paid when Stripe says the app's PaymentIntent succeeded. Safe to call more than once. */
export async function confirmPaymentIntent(intentId: string) {
  const active = await activeStripe();
  if (!active) return null;
  const intent = await active.stripe.paymentIntents.retrieve(intentId);
  const orderId = intent.metadata?.orderId;
  if (!orderId) return null;
  if (intent.status === "succeeded") await markOrderPaid(orderId, intent.id);
  return prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
}

/** Re-checks an order's payment with Stripe, whichever way it was paid. */
export async function confirmOrderPayment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.stripeSessionId || order.paymentStatus === "PAID") return order;
  return order.stripeSessionId.startsWith("pi_") ? confirmPaymentIntent(order.stripeSessionId) : confirmCheckoutSession(order.stripeSessionId);
}

/** Releases reserved stock for an order that was never paid and cancels it. Safe to call more than once. */
export async function releaseUnpaidOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const released = await tx.order.updateMany({ where: { id: orderId, paymentStatus: "UNPAID", status: "PENDING" }, data: { paymentStatus: "FAILED", status: "CANCELLED" } });
    if (released.count !== 1) return;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (item.variantId) await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    }
  });
}

/** Called when the fan leaves Stripe without paying: closes the session so it cannot be paid later, then frees the stock. */
export async function cancelCheckout(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus !== "UNPAID" || order.status !== "PENDING") return order;
  const active = await activeStripe();
  if (active && order.stripeSessionId?.startsWith("pi_")) {
    const intent = await active.stripe.paymentIntents.retrieve(order.stripeSessionId).catch(() => null);
    if (intent?.status === "succeeded") return confirmPaymentIntent(intent.id);
    // A payment still settling must not lose its stock; the webhook finishes it either way.
    if (intent?.status === "processing") return order;
    if (intent && intent.status !== "canceled") await active.stripe.paymentIntents.cancel(intent.id).catch(() => null);
  } else if (active && order.stripeSessionId) {
    const session = await active.stripe.checkout.sessions.retrieve(order.stripeSessionId).catch(() => null);
    if (session?.payment_status === "paid") return confirmCheckoutSession(session.id);
    if (session?.status === "open") await active.stripe.checkout.sessions.expire(session.id).catch(() => null);
  }
  await releaseUnpaidOrder(orderId);
  return prisma.order.findUnique({ where: { id: orderId } });
}
