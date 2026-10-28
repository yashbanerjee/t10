import { prisma } from "@/lib/db";
import { activeStripe } from "@/lib/stripe";

export type PaymentMethods = { stripe: boolean; cashOnDelivery: boolean };

/** Which shop payment methods are available right now (Stripe needs keys + enabled). */
export async function getPaymentMethods(): Promise<PaymentMethods> {
  const [stripeActive, cashRow] = await Promise.all([
    activeStripe().then(Boolean),
    prisma.siteSetting.findUnique({ where: { key: "cashOnDelivery" } }).catch(() => null),
  ]);
  const value = cashRow?.value;
  const cashOnDelivery = Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as { enabled?: unknown }).enabled === true);
  return { stripe: stripeActive, cashOnDelivery };
}

export function paymentMethodsAvailable(methods: PaymentMethods) {
  return methods.stripe || methods.cashOnDelivery;
}
