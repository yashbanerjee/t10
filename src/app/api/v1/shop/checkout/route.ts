import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { notifyAdminAndUser } from "@/lib/mail";
import { renderEmail } from "@/lib/email-template";
import { formatMoney } from "@/lib/money";

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
          items: { create: lines.map((line) => ({ productName: line.variant.product.name, color: line.variant.color, size: line.variant.size, quantity: line.quantity, unitPrice: line.unitPrice })) },
        },
        include: { items: true },
      });
    });
    const items = order.items.map((item) => ({
      label: `${item.quantity} × ${item.productName}${item.color || item.size ? ` (${[item.color, item.size].filter(Boolean).join(", ")})` : ""}`,
      value: formatMoney(Number(item.unitPrice) * item.quantity),
    }));
    const total = { label: "Total", value: formatMoney(Number(order.total)) };
    const delivery = { label: "Delivery", value: `${order.address}\n${order.city}, ${order.country}` };
    await notifyAdminAndUser({
      admin: await renderEmail({
        subject: `New shop booking ${order.number}`,
        preheader: `${order.name} booked ${order.items.length} item${order.items.length === 1 ? "" : "s"} for ${total.value}.`,
        eyebrow: "Shop booking",
        title: `Booking ${order.number}`,
        intro: "A fan has booked merchandise. Contact them to confirm payment and delivery.",
        details: [{ label: "Tracking number", value: order.number }, { label: "Name", value: order.name }, { label: "Email", value: order.email }, { label: "Phone", value: order.phone }, delivery, ...(order.notes ? [{ label: "Notes", value: order.notes }] : [])],
        items,
        total,
        cta: { label: "Open orders", href: "/admin/orders" },
      }),
      userEmail: order.email,
      user: await renderEmail({
        subject: `Your United Tigers booking ${order.number}`,
        preheader: `Your tracking number is ${order.number}. The club will confirm payment with you.`,
        eyebrow: "Booking received",
        title: "Your kit is reserved",
        greeting: `Hello ${order.name},`,
        intro: "Thanks for backing the Tigers. We have reserved your items, and the club will contact you by phone or email to confirm payment and delivery.",
        details: [{ label: "Tracking number", value: order.number }, { label: "Status", value: "Booked — awaiting confirmation" }, delivery, ...(order.notes ? [{ label: "Your notes", value: order.notes }] : [])],
        items,
        total,
        cta: { label: "Track your booking", href: `/track-order?number=${encodeURIComponent(order.number)}&email=${encodeURIComponent(order.email)}` },
        note: `Payment is confirmed by the club. You can check your booking any time at the Track your order page in the website footer, using tracking number ${order.number} and this email address.`,
      }),
    });
    return success({ number: order.number }, "Order booked", { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "STOCK" || error.message === "MISSING")) return failure("One of the items is no longer available in that size or colour", 409);
    return failure("The order could not be booked. Please try again.", 503);
  }
}
