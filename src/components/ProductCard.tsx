import Link from "next/link";
import type { getProducts } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { bySize } from "@/lib/sizes";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

export function ProductCard({ product }: { product: Product }) {
  const photo = product.image || product.variants.find((variant) => variant.image)?.image;
  const colors = [...new Set(product.variants.map((variant) => variant.color).filter(Boolean))];
  const sizes = [...new Set([...product.variants].sort(bySize).map((variant) => variant.size))];
  return <Link className="product-card" href={`/shop/${product.slug}`}>
    <div className={photo ? "product-card-photo" : "product-card-photo is-empty"} style={photo ? { "--photo": `url('${photo}')` } as React.CSSProperties : undefined}><span>{product.category}</span></div>
    <div><h2>{product.name}</h2><p>{formatMoney(product.price)}</p><small>{colors.length ? colors.join(" · ") : sizes.length ? `Sizes ${sizes.join(" · ")}` : "Sizes coming"}</small></div>
  </Link>;
}
