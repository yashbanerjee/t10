import { prisma } from "@/lib/db";
import { notifyAdminAndUser } from "@/lib/mail";
import { renderEmail } from "@/lib/email-template";
import { formatMoney } from "@/lib/money";

/** Sends the fan and admin booking emails. Paid orders say so; unpaid ones say the club will confirm payment. */
export async function sendBookingEmails(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const paid = order.paymentStatus === "PAID";
  const items = order.items.map((item) => ({
    label: `${item.quantity} × ${item.productName}${item.color || item.size ? ` (${[item.color, item.size].filter(Boolean).join(", ")})` : ""}`,
    value: formatMoney(Number(item.unitPrice) * item.quantity),
  }));
  const total = { label: paid ? "Paid" : "Total", value: formatMoney(Number(order.total)) };
  const delivery = { label: "Delivery", value: `${order.address}\n${order.city}, ${order.country}` };
  const payment = { label: "Payment", value: paid ? `Paid online${order.paidAt ? ` on ${order.paidAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : ""}` : "To be confirmed by the club" };
  const trackHref = `/track-order?number=${encodeURIComponent(order.number)}&email=${encodeURIComponent(order.email)}`;
  await notifyAdminAndUser({
    admin: await renderEmail({
      subject: `${paid ? "Paid order" : "New shop booking"} ${order.number}`,
      preheader: `${order.name} ${paid ? "paid" : "booked"} ${formatMoney(Number(order.total))} for ${order.items.length} item${order.items.length === 1 ? "" : "s"}.`,
      eyebrow: paid ? "Paid online" : "Shop booking",
      title: `${paid ? "Order" : "Booking"} ${order.number}`,
      intro: paid ? "A fan has paid for merchandise online. Prepare the kit and arrange delivery." : "A fan has booked merchandise. Contact them to confirm payment and delivery.",
      details: [{ label: "Tracking number", value: order.number }, payment, { label: "Name", value: order.name }, { label: "Email", value: order.email }, { label: "Phone", value: order.phone }, delivery, ...(order.notes ? [{ label: "Notes", value: order.notes }] : [])],
      items,
      total,
      cta: { label: "Open orders", href: "/admin/orders" },
    }),
    userEmail: order.email,
    user: await renderEmail({
      subject: paid ? `Payment received — United Tigers order ${order.number}` : `Your United Tigers booking ${order.number}`,
      preheader: `Your tracking number is ${order.number}.${paid ? " Your payment was successful." : " The club will confirm payment with you."}`,
      eyebrow: paid ? "Payment received" : "Booking received",
      title: paid ? "Your kit is paid for" : "Your kit is reserved",
      greeting: `Hello ${order.name},`,
      intro: paid
        ? "Thanks for backing the Tigers. Your payment was successful and your order is confirmed. The club will be in touch about delivery."
        : "Thanks for backing the Tigers. We have reserved your items, and the club will contact you by phone or email to confirm payment and delivery.",
      details: [{ label: "Tracking number", value: order.number }, payment, delivery, ...(order.notes ? [{ label: "Your notes", value: order.notes }] : [])],
      items,
      total,
      cta: { label: "Track your order", href: trackHref },
      note: `You can check your order any time from Track your order in the website footer, using tracking number ${order.number} and this email address.`,
    }),
  });
}
