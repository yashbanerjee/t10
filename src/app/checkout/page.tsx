import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCountries } from "@/lib/countries";
import { getPaymentMethods, paymentMethodsAvailable } from "@/lib/payments";

export const metadata: Metadata = { title: "Checkout", description: "Book United Tigers kit with your name, email and phone." };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  const [payments, countries] = await Promise.all([getPaymentMethods(), getCountries()]);
  const available = paymentMethodsAvailable(payments);
  const intro = !available
    ? "Checkout is not available right now. Please check back soon."
    : payments.stripe && payments.cashOnDelivery
      ? "Name, email, phone and a delivery address. Pay securely by card with Stripe, or choose cash on delivery."
      : payments.stripe
        ? "Name, email, phone and a delivery address, then pay securely by card with Stripe."
        : "Name, email, phone and a delivery address. Pay cash when your kit is delivered.";
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />CHECKOUT</span><h1>YOUR DETAILS.</h1><p>{intro}</p></div></section>
    <section className="section"><div className="wrap"><CheckoutForm payments={payments} countries={countries} cancelledOrderId={typeof cancelled === "string" ? cancelled.slice(0, 40) : ""} /></div></section>
  </div>;
}
