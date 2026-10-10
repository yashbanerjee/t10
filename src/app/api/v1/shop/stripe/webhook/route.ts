import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { failure, success } from "@/lib/api";
import { confirmCheckoutSession, readStripeConfig, releaseUnpaidOrder, stripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const config = await readStripeConfig();
  if (!config?.secretKey || !config.webhookSecret) return failure("Stripe webhook is not configured", 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return failure("Missing Stripe signature", 400);
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripeClient(config.secretKey).webhooks.constructEvent(payload, signature, config.webhookSecret);
  } catch {
    return failure("Invalid Stripe signature", 400);
  }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await confirmCheckoutSession(event.data.object.id);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const orderId = event.data.object.metadata?.orderId || event.data.object.client_reference_id;
      if (orderId) await releaseUnpaidOrder(orderId);
    }
  } catch (error) {
    console.error("Stripe webhook failed", error instanceof Error ? error.message : "unknown error");
    return failure("Webhook handling failed", 500);
  }
  return success({ received: true });
}
