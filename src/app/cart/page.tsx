"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const cart = useCart();
  const total = cart.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />YOUR BAG</span><h1>READY TO<br />BOOK.</h1><p>Review the colour and size, then leave your email and phone so the club can confirm the order.</p></div></section>
    <section className="section"><div className="wrap">
      {cart.lines.length ? <div className="cart-layout">
        <div className="cart-lines">{cart.lines.map((line) => <article key={line.variantId}>
          <div className={line.image ? "cart-thumb" : "cart-thumb is-empty"} style={line.image ? { backgroundImage: `url('${line.image}')` } : undefined} />
          <div><h2>{line.name}</h2><p>{line.color} · {line.size}</p><strong>{formatMoney(line.price)}</strong></div>
          <label>Qty<input type="number" min={1} max={10} value={line.quantity} onChange={(event) => cart.setQuantity(line.variantId, Number(event.target.value))} /></label>
          <button type="button" onClick={() => cart.remove(line.variantId)}>Remove</button>
        </article>)}</div>
        <aside className="checkout-summary"><p className="checkout-total"><span>Total</span><strong>{formatMoney(total)}</strong></p><Link className="button button-primary" href="/checkout">CHECKOUT</Link></aside>
      </div> : <div className="fan-empty"><h2>Your bag is empty.</h2><Link className="button button-primary" href="/shop">BROWSE THE KIT</Link></div>}
    </div></section>
  </div>;
}
