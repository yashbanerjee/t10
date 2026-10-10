import { NextRequest } from "next/server";
import { z } from "zod";
import { failure, success } from "@/lib/api";
import { cancelCheckout } from "@/lib/stripe";

const input = z.object({ orderId: z.string().trim().min(10).max(40) });

/** The order id is only known to the fan who was sent to Stripe, through the cancel link. */
export async function POST(request: NextRequest) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Unknown order", 400);
  try {
    const order = await cancelCheckout(parsed.data.orderId);
    if (!order) return failure("Unknown order", 404);
    return success({ number: order.number, paymentStatus: order.paymentStatus, status: order.status });
  } catch {
    return failure("Could not update the order", 503);
  }
}
