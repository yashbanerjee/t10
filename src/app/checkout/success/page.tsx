import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { confirmCheckoutSession } from "@/lib/stripe";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Payment received", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const order = typeof sessionId === "string" && sessionId.startsWith("cs_") ? await confirmCheckoutSession(sessionId).catch(() => null) : null;
  const paid = order?.paymentStatus === "PAID";
  const trackHref = order ? `/track-order?number=${encodeURIComponent(order.number)}&email=${encodeURIComponent(order.email)}` : "/track-order";

  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />CHECKOUT</span><h1>{paid ? <>PAYMENT<br />RECEIVED.</> : <>CHECKING YOUR<br />PAYMENT.</>}</h1><p>{paid ? "Thanks for backing the Tigers. A confirmation is on its way to your email." : "We could not confirm this payment yet. If you were charged, your order will update shortly."}</p></div></section>
    <section className="section"><div className="wrap">
      {order ? <div className="fan-empty">
        {paid && <ClearCart />}
        <span className="eyebrow"><i className="eyebrow-dot" />{paid ? "PAID" : "PAYMENT PENDING"}</span>
        <h2>{paid ? "YOUR KIT IS PAID FOR" : "ALMOST THERE"}</h2>
        <div className="booking-tracking"><small>TRACKING NUMBER</small><strong>{order.number}</strong></div>
        <p>{paid ? `${formatMoney(Number(order.total))} paid. Keep this number to track your order. The club will be in touch about delivery.` : "Keep this number. You can check the payment status on the tracking page."}</p>
        <div className="booking-actions">
          <Link className="button button-accent" href={trackHref}>TRACK THIS ORDER</Link>
          <Link className="button button-outline" href="/shop">BACK TO THE SHOP</Link>
        </div>
      </div> : <div className="fan-empty">
        <h2>ORDER NOT FOUND</h2>
        <p>This payment link is not valid. If you paid, use the tracking number from your confirmation email.</p>
        <div className="booking-actions"><Link className="button button-accent" href="/track-order">TRACK AN ORDER</Link><Link className="button button-outline" href="/shop">BACK TO THE SHOP</Link></div>
      </div>}
    </div></section>
  </div>;
}
