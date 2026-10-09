"use client";

import { Plus, Trash2 } from "lucide-react";

export type VariantDraft = { color: string; size: string; stock: string; price: string; image: string };
export type OptionDraft = { id?: string; label: string };
export type EntryRow = { id: string; name: string; email: string; phone: string; answer: string; createdAt: string };
export type OrderView = { number: string; name: string; email: string; phone: string; address: string; city: string; country: string; notes: string | null; total: string | number; items: { id: string; productName: string; color: string; size: string; quantity: number; unitPrice: string | number }[] };

export function VariantEditor({ rows, onChange }: { rows: VariantDraft[]; onChange: (rows: VariantDraft[]) => void }) {
  async function upload(index: number, file?: File) {
    if (!file) return;
    const body = new FormData(); body.append("file", file); body.append("folder", "products");
    const response = await fetch("/api/v1/admin/media/upload", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Upload failed.");
    onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, image: result.data.url } : row));
  }
  return <div className="catalog-block">
    <div className="catalog-block-head"><strong>Colours and sizes</strong><button type="button" onClick={() => onChange([...rows, { color: "", size: "", stock: "0", price: "", image: "" }])}><Plus size={14} /> Add variant</button></div>
    <p>Each row is one colour and size. Leave the extra price blank to use the product price. Stock is how many can be booked.</p>
    {rows.map((row, index) => <div className="variant-row" key={index}>
      <input aria-label="Colour" placeholder="Colour" required value={row.color} onChange={(event) => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value } : item))} />
      <input aria-label="Size" placeholder="Size" required value={row.size} onChange={(event) => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, size: event.target.value } : item))} />
      <input aria-label="Stock" placeholder="Stock" type="number" min={0} required value={row.stock} onChange={(event) => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, stock: event.target.value } : item))} />
      <input aria-label="Variant price" placeholder="Price" type="number" min={0} step="0.01" value={row.price} onChange={(event) => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} />
      <label className={`variant-file${row.image ? " has-image" : ""}`}>{row.image ? <img src={row.image} alt="" /> : "Image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(index, event.currentTarget.files?.[0]).catch(() => undefined)} /></label>
      <button type="button" aria-label="Remove variant" disabled={rows.length === 1} onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button>
    </div>)}
  </div>;
}

export function OptionEditor({ rows, onChange }: { rows: OptionDraft[]; onChange: (rows: OptionDraft[]) => void }) {
  return <div className="catalog-block">
    <div className="catalog-block-head"><strong>Poll choices</strong><button type="button" disabled={rows.length >= 8} onClick={() => onChange([...rows, { label: "" }])}><Plus size={14} /> Add choice</button></div>
    {rows.map((row, index) => <div className="option-row" key={row.id ?? index}>
      <input aria-label={`Choice ${index + 1}`} placeholder={`Choice ${index + 1}`} required value={row.label} onChange={(event) => onChange(rows.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} />
      <button type="button" aria-label="Remove choice" disabled={rows.length <= 2} onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={14} /></button>
    </div>)}
  </div>;
}

export function ContestEntries({ entries }: { entries: EntryRow[] }) {
  if (!entries.length) return <p className="catalog-note">No fans have entered yet.</p>;
  return <div className="catalog-block"><strong>{entries.length} entries</strong><div className="entry-list">{entries.map((entry) => <article key={entry.id}><b>{entry.name}</b><span>{entry.email} · {entry.phone}</span><p>{entry.answer}</p></article>)}</div></div>;
}

export function OrderSummary({ order }: { order: OrderView }) {
  return <div className="catalog-block"><strong>{order.number}</strong><p>{order.name} · {order.email} · {order.phone}</p><p>{order.address}, {order.city}, {order.country}</p>{order.notes && <p>{order.notes}</p>}<div className="entry-list">{order.items.map((item) => <article key={item.id}><b>{item.productName}</b><span>{item.color} · {item.size} · {item.quantity} × {item.unitPrice}</span></article>)}</div></div>;
}
