"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/money";

type Variant = { id: string; color: string; size: string; stock: number; price: number | null; image: string | null };

export function ProductPicker({ product }: { product: { name: string; image: string | null; price: number; variants: Variant[] } }) {
  const cart = useCart();
  const router = useRouter();
  const colors = useMemo(() => [...new Set(product.variants.map((variant) => variant.color))], [product.variants]);
  const [color, setColor] = useState(colors[0] ?? "");
  const sizes = product.variants.filter((variant) => variant.color === color);
  const [size, setSize] = useState(sizes[0]?.size ?? "");
  const selected = product.variants.find((variant) => variant.color === color && variant.size === size) ?? sizes[0];
  const [added, setAdded] = useState(false);
  const price = selected?.price ?? product.price;
  const photo = selected?.image || product.image;

  function chooseColor(next: string) {
    setColor(next);
    const first = product.variants.find((variant) => variant.color === next);
    setSize(first?.size ?? "");
    setAdded(false);
  }

  function add(goToCart: boolean) {
    if (!selected || selected.stock < 1) return;
    cart.add({ variantId: selected.id, name: product.name, color: selected.color, size: selected.size, price, image: photo }, 1);
    setAdded(true);
    if (goToCart) router.push("/cart");
  }

  return <div className="product-buy">
    {photo ? <div className="product-photo" style={{ backgroundImage: `url('${photo}')` }} /> : <div className="product-photo product-photo-empty"><span>{product.name.slice(0, 1)}</span></div>}
    <div>
      <p className="product-price">{formatMoney(price)}</p>
      <p className="field-label">Colour</p>
      <div className="choice-row">{colors.map((item) => <button type="button" key={item} className={item === color ? "is-selected" : ""} onClick={() => chooseColor(item)}>{item}</button>)}</div>
      <p className="field-label">Size</p>
      <div className="choice-row">{product.variants.filter((variant) => variant.color === color).map((variant) => <button type="button" key={variant.id} className={variant.size === selected?.size ? "is-selected" : ""} disabled={variant.stock < 1} onClick={() => { setSize(variant.size); setAdded(false); }}>{variant.size}</button>)}</div>
      <p className="stock-note">{selected && selected.stock > 0 ? `${selected.stock} available` : "Out of stock in this colour and size"}</p>
      <div className="hero-actions">
        <button className="button button-primary" type="button" disabled={!selected || selected.stock < 1} onClick={() => add(false)}>{added ? <><Check size={15} /> ADDED</> : <><ShoppingBag size={15} /> ADD TO BAG</>}</button>
        <button className="button button-outline" type="button" disabled={!selected || selected.stock < 1} onClick={() => add(true)}>BUY NOW</button>
      </div>
    </div>
  </div>;
}
