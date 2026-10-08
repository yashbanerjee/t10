"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ContestEntries, OptionEditor, OrderSummary, VariantEditor, type EntryRow, type OptionDraft, type OrderView, type VariantDraft } from "@/components/CatalogFields";
import { adminSections, type Field } from "@/components/AdminWorkspace";
import { flattenCareer } from "@/lib/career-record";
import { describeIssues } from "@/lib/admin-validation";

const inputDate = (value: unknown) => { if (!value) return ""; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16); };
const inputDay = (value: unknown) => { if (!value) return ""; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10); };
const bound = (value: number | string | undefined) => value === "today" ? new Date().toISOString().slice(0, 10) : value;
/** Browser-side limits that mirror the API rules, so invalid values are caught before the request is sent. */
const constraints = (field: Field) => ({ pattern: field.pattern, title: field.title, maxLength: field.maxLength, min: bound(field.min) ?? (field.type === "number" ? 0 : undefined), max: bound(field.max) });

function blankForm(section: string, fields: Field[]) {
  const values: Record<string, string | boolean> = {};
  for (const field of fields) values[field.key] = field.type === "checkbox" ? ["isActive", "isPublished"].includes(field.key) : field.type === "select" ? (field.options?.[0] === "" ? "" : field.options?.[0] ?? "") : field.key === "publishedAt" || field.key === "date" ? inputDate(new Date()) : "";
  if (section === "users") values.role = "EDITOR";
  return values;
}

function formFromRecord(section: string, fields: Field[], item: Record<string, unknown>) {
  const values: Record<string, string | boolean> = {};
  for (const field of fields) {
    const value = item[field.key];
    values[field.key] = field.type === "checkbox" ? Boolean(value) : field.type === "date" ? inputDate(value) : field.type === "day" ? inputDay(value) : value == null ? "" : section === "settings" && typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  }
  return values;
}

function CareerInputs({ fields, form, onChange }: { fields: Field[]; form: Record<string, string | boolean>; onChange: (key: string, value: string | boolean) => void }) {
  return <div className="admin-editor-grid">{fields.map((field) => <label className="admin-field" key={field.key}><span className="admin-field-label">{field.label}</span><span className="admin-field-control"><input type={field.type === "number" ? "number" : "text"} {...constraints(field)} step={field.step ?? (field.type === "number" ? "1" : undefined)} value={String(form[field.key] ?? "")} onChange={(event) => onChange(field.key, event.target.value)} /></span><span className="admin-field-note">{field.hint ?? ""}</span></label>)}</div>;
}

function PlayerCareerFields({ fields, form, role, onChange }: { fields: Field[]; form: Record<string, string | boolean>; role: string; onChange: (key: string, value: string | boolean) => void }) {
  const visible = (group: Field["group"]) => fields.filter((field) => field.group === group && (!field.roles || !role || field.roles.includes(role)));
  const bowling = visible("bowling");
  return <>
    <section className="catalog-block"><div className="catalog-block-head"><h3>Career batting</h3></div><p className="catalog-note">Lifetime figures from before this season. Matches, runs, strike rate and best score appear on the player’s career tab and are added to scorecard totals.</p><CareerInputs fields={visible("batting")} form={form} onChange={onChange} /></section>
    {bowling.length > 0 && <section className="catalog-block"><div className="catalog-block-head"><h3>Career bowling</h3></div><p className="catalog-note">Shown for bowlers and all-rounders. Use cricket overs such as 48.2 and best figures such as 4/18.</p><CareerInputs fields={bowling} form={form} onChange={onChange} /></section>}
    <section className="catalog-block"><div className="catalog-block-head"><h3>Career fielding</h3></div><p className="catalog-note">Catches, run outs and stumpings from the player’s career.</p><CareerInputs fields={visible("fielding")} form={form} onChange={onChange} /></section>
  </>;
}

export function AdminRecordForm({ section, recordId }: { section: string; recordId: string }) {
  const definition = adminSections[section];
  const router = useRouter();
  const isNew = recordId === "new";
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(!isNew);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([{ color: "", size: "", stock: "10", price: "", image: "" }]);
  const [options, setOptions] = useState<OptionDraft[]>([{ label: "" }, { label: "" }]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [orderView, setOrderView] = useState<OrderView | null>(null);

  useEffect(() => {
    if (!definition?.fields) return;
    if (isNew) { setForm(blankForm(section, definition.fields)); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/v1/admin/${section}/${recordId}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load this record.");
        if (!cancelled) {
          const item = result.data ?? {};
          setForm(formFromRecord(section, definition.fields ?? [], section === "players" ? { ...item, ...flattenCareer(item.careerRecord) } : item));
          if (section === "products" && Array.isArray(item.variants)) setVariants(item.variants.map((variant: VariantDraft & { stock: number; price: number | null }) => ({ color: variant.color, size: variant.size, stock: String(variant.stock ?? 0), price: variant.price == null ? "" : String(variant.price), image: variant.image || "" })));
          if (section === "polls" && Array.isArray(item.options)) setOptions(item.options.map((option: OptionDraft) => ({ id: option.id, label: option.label })));
          if (section === "contests" && Array.isArray(item.entries)) setEntries(item.entries);
          if (section === "orders") setOrderView(item);
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load this record.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [definition, isNew, recordId, section]);

  if (!definition) return <div className="admin-content"><div className="admin-page-heading"><div><h1>Section unavailable</h1><p>This CMS section doesn’t exist.</p></div></div></div>;
  if (!definition.fields || (isNew && !definition.create) || (!isNew && !definition.edit)) return <div className="admin-content"><div className="admin-page-heading"><div><h1>{definition.title}</h1><p>This section does not use a record form.</p></div><Link className="admin-secondary-btn" href={`/admin/${section}`}>Back to list</Link></div></div>;

  function change(key: string, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }
  async function uploadFile(field: Field, file?: File) {
    if (!file) return;
    setUploading(true); setError(""); setNotice("");
    const upload = new FormData(); upload.append("file", file); upload.append("folder", section);
    try { const response = await fetch("/api/v1/admin/media/upload", { method: "POST", body: upload }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Upload failed."); change(field.key, result.data.url); if (section === "gallery") change("type", file.type === "video/mp4" ? "VIDEO" : "IMAGE"); setNotice(`${file.name} uploaded and attached.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed."); }
    finally { setUploading(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setSaving(true);
    const body: Record<string, unknown> = {};
    for (const field of definition.fields ?? []) {
      const value = form[field.key];
      if (field.type === "checkbox") body[field.key] = Boolean(value);
      else if (field.type === "number") body[field.key] = value === "" ? null : Number(value);
      else if (field.type === "day") body[field.key] = value === "" ? null : String(value);
      else if (field.type === "date") body[field.key] = value ? new Date(String(value)).toISOString() : null;
      else if (field.type === "select" || field.type === "url" || field.type === "file") body[field.key] = value === "" ? null : value;
      else if (!field.required && value === "") body[field.key] = null;
      else body[field.key] = value;
    }
    if (body.slug === null || body.slug === "") delete body.slug;
    if (section === "users" && !isNew && (body.password === "" || body.password == null)) delete body.password;
    if (section === "settings" && typeof body.value === "string") { try { body.value = JSON.parse(body.value); } catch { /* plain-text setting */ } }
    if (section === "products") body.variants = variants.map((variant) => ({ color: variant.color, size: variant.size, stock: Number(variant.stock || 0), price: variant.price === "" ? null : Number(variant.price), image: variant.image || null }));
    if (section === "polls") body.options = options.map((option) => ({ id: option.id, label: option.label }));
    try {
      const response = await fetch(`/api/v1/admin/${section}${isNew ? "" : `/${recordId}`}`, { method: isNew ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) {
        const detail = describeIssues(result.errors, Object.fromEntries((definition.fields ?? []).map((field) => [field.key, field.label])));
        throw new Error(detail ? `${result.message || "Validation failed"}. ${detail}` : result.message || "Could not save this record.");
      }
      router.push(`/admin/${section}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save this record."); setSaving(false); }
  }

  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS CMS</span><h1>{isNew ? `Create ${definition.title.toLowerCase()}` : `Edit ${definition.title.toLowerCase()}`}</h1><p>{definition.subtitle}</p></div><Link className="admin-secondary-btn" href={`/admin/${section}`}>Back to list</Link></div>
    {error && <div className="admin-demo-alert"><AlertTriangle size={14} />{error}</div>}{notice && <p className="admin-notice"><Check size={13} /> {notice}</p>}
    {loading ? <div className="admin-table-wrap"><div className="admin-loading-inline"><span className="admin-spinner" /> LOADING RECORD</div></div> : <form className="admin-editor" onSubmit={save}><div className="admin-editor-grid">{definition.fields.filter((field) => field.type !== "checkbox" && !field.group).map((field) => {
      const wide = field.type === "textarea" || field.type === "richtext";
      const note = [field.type === "file" && form[field.key] ? `Attached: ${String(form[field.key])}` : "", field.type === "file" && uploading ? "Uploading…" : "", field.hint ?? ""].filter(Boolean).join(" ");
      return <label key={field.key} className={`admin-field${wide ? " field-wide" : ""}`}><span className="admin-field-label">{field.label}</span><span className="admin-field-control">{field.type === "richtext" ? <RichTextEditor required={field.required} value={String(form[field.key] ?? "")} onChange={(value) => change(field.key, value)} /> : field.type === "textarea" ? <textarea required={field.required} maxLength={field.maxLength} value={String(form[field.key] ?? "")} onChange={(event) => change(field.key, event.target.value)} /> : field.type === "select" ? <select required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => change(field.key, event.target.value)}>{field.options?.map((option) => <option value={option} key={option}>{option || "Select"}</option>)}</select> : field.type === "file" ? <input type="file" accept={field.accept} required={field.required && !form[field.key]} onChange={(event) => void uploadFile(field, event.currentTarget.files?.[0])} /> : <><input type={field.type === "date" ? "datetime-local" : field.type === "day" ? "date" : field.type === "number" ? "number" : field.type === "url" ? "url" : field.type === "password" ? "password" : "text"} step={field.step ?? (field.key === "price" ? "0.01" : undefined)} {...constraints(field)} required={field.key === "password" ? isNew : field.required} value={String(form[field.key] ?? "")} onChange={(event) => change(field.key, event.target.value)} autoComplete={field.type === "password" ? "new-password" : undefined} list={field.options ? `${field.key}-options` : undefined} />{field.options && <datalist id={`${field.key}-options`}>{field.options.map((option) => <option value={option} key={option} />)}</datalist>}</>}</span><span className="admin-field-note">{note}</span></label>;
    })}</div>
      {section === "players" && <PlayerCareerFields fields={definition.fields} form={form} role={String(form.role ?? "")} onChange={change} />}
      {section === "products" && <VariantEditor rows={variants} onChange={setVariants} />}
      {section === "polls" && <OptionEditor rows={options} onChange={setOptions} />}
      {section === "contests" && !isNew && <ContestEntries entries={entries} />}
      {section === "orders" && orderView && <OrderSummary order={orderView} />}
      {definition.fields.some((field) => field.type === "checkbox") && <div className="admin-checks">{definition.fields.filter((field) => field.type === "checkbox").map((field) => <label key={field.key}><input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => change(field.key, event.target.checked)} /><span>{field.label}</span></label>)}</div>}
      <div className="admin-editor-actions"><Link className="admin-secondary-btn" href={`/admin/${section}`}>Cancel</Link><button className="admin-primary-btn" type="submit" disabled={uploading || saving}>{saving ? "Saving…" : isNew ? "Create record" : "Save changes"}</button></div>
    </form>}
  </div>;
}
