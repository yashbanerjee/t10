import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug } from "@/lib/data";
import { ProductPicker } from "@/components/ProductPicker";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return { title: product?.name ?? "Kit", description: product?.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  return <div className="inner-page">
    <section className="section"><div className="wrap">
      <Link className="text-link" href="/shop"><ArrowLeft size={14} /> BACK TO THE SHOP</Link>
      <div className="product-layout">
        <div><span className="eyebrow"><i className="eyebrow-dot" />{product.category}</span><h1>{product.name}</h1><p>{product.description}</p></div>
        <ProductPicker product={product} />
      </div>
    </div></section>
  </div>;
}
