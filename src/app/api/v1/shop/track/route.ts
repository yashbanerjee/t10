import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";

const trackInput = z.object({
  number: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(180),
});

export async function POST(request: NextRequest) {
  const parsed = trackInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Enter your tracking number and the email you booked with", 400);
  try {
    const order = await prisma.order.findFirst({
      where: { number: { equals: parsed.data.number.toUpperCase(), mode: "insensitive" }, email: { equals: parsed.data.email, mode: "insensitive" } },
      include: { items: true },
    });
    // The same answer for a wrong number or a wrong email, so bookings cannot be probed.
    if (!order) return failure("We could not find a booking with that tracking number and email", 404);
    return success({
      number: order.number,
      status: order.status,
      name: order.name.split(" ")[0],
      createdAt: order.createdAt,
      city: order.city,
      country: order.country,
      total: Number(order.total),
      items: order.items.map((item) => ({ productName: item.productName, color: item.color, size: item.size, quantity: item.quantity, unitPrice: Number(item.unitPrice) })),
    });
  } catch {
    return failure("Tracking is not available right now. Please try again shortly.", 503);
  }
}
