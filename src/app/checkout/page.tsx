import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { activeStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Checkout", description: "Book United Tigers kit with your name, email and phone." };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  const onlinePayment = Boolean(await activeStripe());
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />CHECKOUT</span><h1>YOUR DETAILS.</h1><p>{onlinePayment ? "Name, email, phone and a delivery address, then pay securely by card with Stripe." : "Name, email, phone and a delivery address. We hold the stock and confirm payment with you."}</p></div></section>
    <section className="section"><div className="wrap"><CheckoutForm onlinePayment={onlinePayment} cancelledOrderId={typeof cancelled === "string" ? cancelled.slice(0, 40) : ""} /></div></section>
  </div>;
}
