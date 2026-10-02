"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { adminSections, type Field } from "@/components/AdminWorkspace";

const inputDate = (value: unknown) => { if (!value) return ""; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16); };
const inputDay = (value: unknown) => { if (!value) return ""; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10); };

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

  useEffect(() => {
    if (!definition?.fields) return;
    if (isNew) { setForm(blankForm(section, definition.fields)); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/v1/admin/${section}/${recordId}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load this record.");
        if (!cancelled) setForm(formFromRecord(section, definition.fields ?? [], result.data ?? {}));
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
    try {
      const response = await fetch(`/api/v1/admin/${section}${isNew ? "" : `/${recordId}`}`, { method: isNew ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save this record.");
      router.push(`/admin/${section}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save this record."); setSaving(false); }
  }

  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS CMS</span><h1>{isNew ? `Create ${definition.title.toLowerCase()}` : `Edit ${definition.title.toLowerCase()}`}</h1><p>{definition.subtitle}</p></div><Link className="admin-secondary-btn" href={`/admin/${section}`}>Back to list</Link></div>
    {error && <div className="admin-demo-alert"><AlertTriangle size={14} />{error}</div>}{notice && <p className="admin-notice"><Check size={13} /> {notice}</p>}
    {loading ? <div className="admin-table-wrap"><div className="admin-loading-inline"><span className="admin-spinner" /> LOADING RECORD</div></div> : <form className="admin-editor" onSubmit={save}><div className="admin-editor-grid">{definition.fields.filter((field) => field.type !== "checkbox").map((field) => <label key={field.key} className={field.type === "textarea" || field.type === "richtext" ? "field-wide" : ""}>{field.label}{field.type === "richtext" ? <RichTextEditor required={field.required} value={String(form[field.key] ?? "")} onChange={(value) => change(field.key, value)} /> : field.type === "textarea" ? <textarea required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => change(field.key, event.target.value)} /> : field.type === "select" ? <select required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => change(field.key, event.target.value)}>{field.options?.map((option) => <option value={option} key={option}>{option || "Select"}</option>)}</select> : field.type === "file" ? <><input type="file" accept={field.accept} required={field.required && !form[field.key]} onChange={(event) => void uploadFile(field, event.currentTarget.files?.[0])} />{form[field.key] && <small className="uploaded-file">Attached: {String(form[field.key])}</small>}{uploading && <small>Uploading…</small>}</> : <input type={field.type === "date" ? "datetime-local" : field.type === "day" ? "date" : field.type === "number" ? "number" : field.type === "url" ? "url" : field.type === "password" ? "password" : "text"} required={field.key === "password" ? isNew : field.required} value={String(form[field.key] ?? "")} onChange={(event) => change(field.key, event.target.value)} autoComplete={field.type === "password" ? "new-password" : undefined} />}{field.hint && <small>{field.hint}</small>}</label>)}</div>
      {definition.fields.some((field) => field.type === "checkbox") && <div className="admin-checks">{definition.fields.filter((field) => field.type === "checkbox").map((field) => <label key={field.key}><input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => change(field.key, event.target.checked)} /><span>{field.label}</span></label>)}</div>}
      <div className="admin-editor-actions"><Link className="admin-secondary-btn" href={`/admin/${section}`}>Cancel</Link><button className="admin-primary-btn" type="submit" disabled={uploading || saving}>{saving ? "Saving…" : isNew ? "Create record" : "Save changes"}</button></div>
    </form>}
  </div>;
}
