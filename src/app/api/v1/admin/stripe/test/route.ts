import { getSession, hasPermission } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { readStripeConfig, stripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "SETTINGS_WRITE")) return failure("You do not have permission to check Stripe", 403);
  const config = await readStripeConfig();
  if (!config?.secretKey) return failure("Save a Stripe secret key first", 400);
  try {
    const balance = await stripeClient(config.secretKey).balance.retrieve();
    const mode = balance.livemode ? "live" : "test";
    return success({ mode, enabled: config.enabled, webhook: Boolean(config.webhookSecret) }, `Stripe keys work (${mode} mode).${config.enabled ? "" : " Turn on online payments to use them at checkout."}${config.webhookSecret ? "" : " Add the webhook signing secret so payments confirm even if the fan closes the page."}`);
  } catch (error) {
    return failure(`Stripe rejected the key: ${error instanceof Error ? error.message : "unknown error"}`, 502);
  }
}
