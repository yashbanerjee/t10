import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/data";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Shop", description: "Official United Tigers kit. Choose a colour and size, then book it with your email and phone." };

export default async function ShopPage() {
  const products = await getProducts();
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />OFFICIAL KIT</span><h1>WEAR THE<br />STRIPES.</h1><p>Match-day kit, training wear and club colours. Pick a colour and size, then book it. The club confirms payment with you.</p></div></section>
    <section className="section"><div className="wrap">
      {products.length ? <div className="product-grid">{products.map((product) => {
        const photo = product.image || product.variants.find((variant) => variant.image)?.image;
        const colors = [...new Set(product.variants.map((variant) => variant.color))];
        return <Link className="product-card" href={`/shop/${product.slug}`} key={product.id}>
          <div className={photo ? "product-card-photo" : "product-card-photo is-empty"} style={photo ? { backgroundImage: `url('${photo}')` } : undefined}><span>{product.category}</span></div>
          <div><h2>{product.name}</h2><p>{formatMoney(product.price)}</p><small>{colors.join(" · ") || "Colours coming"}</small></div>
        </Link>;
      })}</div> : <div className="fan-empty"><h2>The shop is being kitted out.</h2><p>Jerseys and training wear will appear here as soon as the club publishes them.</p></div>}
    </div></section>
  </div>;
}
