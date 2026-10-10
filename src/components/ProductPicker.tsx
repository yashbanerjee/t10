"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/money";
import { bySize } from "@/lib/sizes";

type Variant = { id: string; color: string; size: string; stock: number; price: number | null; image: string | null };

export function ProductPicker({ product }: { product: { name: string; image: string | null; images?: string[]; price: number; variants: Variant[] } }) {
  const cart = useCart();
  const router = useRouter();
  const colors = useMemo(() => [...new Set(product.variants.map((variant) => variant.color))], [product.variants]);
  const gallery = useMemo(() => {
    const listed = (product.images ?? []).filter((item) => item);
    const unique = [...new Set(listed)];
    if (unique.length) return unique;
    return product.image ? [product.image] : [];
  }, [product.image, product.images]);
  const [color, setColor] = useState(colors[0] ?? "");
  const [photoIndex, setPhotoIndex] = useState(0);
  const sizes = product.variants.filter((variant) => variant.color === color).sort(bySize);
  const [size, setSize] = useState(sizes[0]?.size ?? "");
  const selected = product.variants.find((variant) => variant.color === color && variant.size === size) ?? sizes[0];
  const [added, setAdded] = useState(false);
  const price = selected?.price ?? product.price;
  const photo = selected?.image || gallery[photoIndex] || product.image;

  function chooseColor(next: string) {
    setColor(next);
    const first = product.variants.find((variant) => variant.color === next);
    setSize(first?.size ?? "");
    setAdded(false);
  }

  function add(goToCart: boolean) {
    if (!selected || selected.stock < 1) return;
    cart.add({ variantId: selected.id, name: product.name, color: selected.color, size: selected.size, price, image: product.image || photo }, 1);
    setAdded(true);
    if (goToCart) router.push("/cart");
  }

  return <div className="product-buy">
    <div className="product-gallery">
      {photo ? <div className="product-photo" style={{ backgroundImage: `url('${photo}')` }} /> : <div className="product-photo product-photo-empty"><span>{product.name.slice(0, 1)}</span></div>}
      {gallery.length > 1 && <div className="product-thumbs">{gallery.map((item, index) => <button type="button" key={item} className={index === photoIndex ? "is-selected" : ""} aria-label={`View ${index + 1} of ${gallery.length}`} style={{ backgroundImage: `url('${item}')` }} onClick={() => setPhotoIndex(index)} />)}</div>}
    </div>
    <div>
      <p className="product-price">{formatMoney(price)}</p>
      {colors.some(Boolean) && <>
        <p className="field-label">Colour</p>
        <div className="choice-row">{colors.map((item) => <button type="button" key={item} className={item === color ? "is-selected" : ""} onClick={() => chooseColor(item)}>{item}</button>)}</div>
      </>}
      <p className="field-label">Size</p>
      <div className="choice-row">{sizes.map((variant) => <button type="button" key={variant.id} className={variant.size === selected?.size ? "is-selected" : ""} disabled={variant.stock < 1} onClick={() => { setSize(variant.size); setAdded(false); }}>{variant.size}</button>)}</div>
      <p className="stock-note">{selected && selected.stock > 0 ? `${selected.stock} available` : colors.some(Boolean) ? "Out of stock in this colour and size" : "Out of stock in this size"}</p>
      <div className="hero-actions">
        <button className="button button-primary" type="button" disabled={!selected || selected.stock < 1} onClick={() => add(false)}>{added ? <><Check size={15} /> ADDED</> : <><ShoppingBag size={15} /> ADD TO BAG</>}</button>
        <button className="button button-outline" type="button" disabled={!selected || selected.stock < 1} onClick={() => add(true)}>BUY NOW</button>
      </div>
    </div>
  </div>;
}
