import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = { title: "Shop", description: "Official United Tigers kit. Choose your size, then book it with your email and phone." };

export default async function ShopPage() {
  const products = await getProducts();
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />OFFICIAL KIT</span><h1>WEAR THE<br />STRIPES.</h1><p>Match-day kit, training wear and club colours. Pick your size, then book it. The club confirms payment with you.</p></div></section>
    <section className="section"><div className="wrap">
      {products.length ? <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="fan-empty"><h2>The shop is being kitted out.</h2><p>Jerseys and training wear will appear here as soon as the club publishes them.</p></div>}
    </div></section>
  </div>;
}
