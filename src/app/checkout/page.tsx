import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", description: "Book United Tigers kit with your name, email and phone." };

export default function CheckoutPage() {
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />CHECKOUT</span><h1>YOUR DETAILS.</h1><p>Name, email, phone and a delivery address. We hold the stock and confirm payment with you.</p></div></section>
    <section className="section"><div className="wrap"><CheckoutForm /></div></section>
  </div>;
}
