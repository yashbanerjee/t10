import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { activeStripe, createCheckoutSession, releaseUnpaidOrder } from "@/lib/stripe";

const checkoutInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(4).max(240),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(10) })).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutInput.safeParse(body);
  if (!parsed.success) return failure("Check your name, email, phone and delivery details", 400, parsed.error.issues);
  const data = parsed.data;
  if (!(await activeStripe())) return failure("Online payment is not available right now, so orders cannot be placed. Please try again later.", 503);
  const merged = new Map<string, number>();
  for (const item of data.items) merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
  try {
    const order = await prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({ where: { id: { in: [...merged.keys()] } }, include: { product: true } });
      if (variants.length !== merged.size) throw new Error("MISSING");
      const lines = variants.map((variant) => {
        const quantity = merged.get(variant.id) ?? 0;
        if (!variant.product.isPublished || variant.stock < quantity) throw new Error("STOCK");
        return { variant, quantity, unitPrice: Number(variant.price ?? variant.product.price) };
      });
      for (const line of lines) {
        const reserved = await tx.productVariant.updateMany({ where: { id: line.variant.id, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } });
        if (reserved.count !== 1) throw new Error("STOCK");
      }
      const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
      return tx.order.create({
        data: {
          number: `UT-${Date.now().toString(36).toUpperCase()}`,
          name: data.name,
          email: data.email.toLowerCase(),
          phone: data.phone,
          address: data.address,
          city: data.city,
          country: data.country,
          notes: data.notes || null,
          total,
          items: { create: lines.map((line) => ({ variantId: line.variant.id, productName: line.variant.product.name, color: line.variant.color, size: line.variant.size, quantity: line.quantity, unitPrice: line.unitPrice })) },
        },
        include: { items: true },
      });
    });
    try {
      const checkoutUrl = await createCheckoutSession(order.id);
      return success({ number: order.number, checkoutUrl }, "Order created. Continue to payment.", { status: 201 });
    } catch (error) {
      console.error("Stripe checkout failed", error instanceof Error ? error.message : "unknown error");
      await releaseUnpaidOrder(order.id);
      return failure("Online payment is not available right now. Please try again shortly.", 502);
    }
  } catch (error) {
    if (error instanceof Error && (error.message === "STOCK" || error.message === "MISSING")) return failure("One of the items is no longer available in that size or colour", 409);
    return failure("The order could not be booked. Please try again.", 503);
  }
}
