"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, ExternalLink, RefreshCw } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { LEGAL_SETTING_KEYS, legalDefaults, readLegalPage, type LegalPage, type LegalPageKind } from "@/lib/legal-pages";

const kinds: { kind: LegalPageKind; heading: string; path: string }[] = [{ kind: "privacy", heading: "Privacy policy", path: "/privacy" }, { kind: "terms", heading: "Terms of use", path: "/terms" }];
const today = () => new Date().toISOString().slice(0, 10);

function LegalPageForm({ kind, heading, path, initial }: { kind: LegalPageKind; heading: string; path: string; initial: LegalPage }) {
  const [page, setPage] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const change = (patch: Partial<LegalPage>) => { setPage((current) => ({ ...current, ...patch })); setNotice(""); };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/v1/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: LEGAL_SETTING_KEYS[kind], value: page }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Could not save this page.");
      setNotice(`${heading} saved. The public page shows it straight away.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this page.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-editor legal-editor" onSubmit={save}>
    <div className="admin-panel-header"><h2>{heading}</h2><a className="admin-secondary-btn" href={path} target="_blank" rel="noreferrer"><ExternalLink size={13} /> View page</a></div>
    {error && <p className="form-status form-status-error">{error}</p>}
    {notice && <p className="admin-notice"><Check size={13} /> {notice}</p>}
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">Page title</span><span className="admin-field-control"><input value={page.title} onChange={(event) => change({ title: event.target.value })} required minLength={2} maxLength={60} /></span><span className="admin-field-note">Large heading at the top of the page.</span></label>
      <label className="admin-field"><span className="admin-field-label">Last updated</span><span className="admin-field-control"><input type="date" value={page.updatedOn} onChange={(event) => change({ updatedOn: event.target.value })} required /></span><span className="admin-field-note"><button type="button" className="admin-link-btn" onClick={() => change({ updatedOn: today() })}>Set to today</button> Change this whenever the wording changes.</span></label>
      <label className="admin-field field-wide"><span className="admin-field-label">Introduction</span><span className="admin-field-control"><textarea value={page.intro} onChange={(event) => change({ intro: event.target.value })} maxLength={300} rows={2} /></span><span className="admin-field-note">One or two sentences under the heading.</span></label>
      <label className="admin-field field-wide"><span className="admin-field-label">Page text</span><span className="admin-field-control"><RichTextEditor value={page.content} onChange={(content) => change({ content })} required /></span><span className="admin-field-note">Use Heading for each section title and Bulleted list for lists. Links to other pages can start with /, for example /contact.</span></label>
    </div>
    <div className="admin-editor-actions"><button type="button" className="admin-secondary-btn" disabled={busy} onClick={() => { if (window.confirm(`Replace the ${heading.toLowerCase()} in this form with the original text? Nothing changes on the website until you save.`)) change({ ...legalDefaults[kind], updatedOn: today() }); }}><RefreshCw size={13} /> Restore original text</button><button className="admin-primary-btn" type="submit" disabled={busy}>{busy ? "SAVING…" : `SAVE ${heading.toUpperCase()}`}</button></div>
  </form>;
}

export function LegalPagesPanel() {
  const [pages, setPages] = useState<Record<LegalPageKind, LegalPage> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/v1/admin/settings", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not load the legal pages.");
        const rows = Array.isArray(result.data) ? result.data as { key: string; value: unknown }[] : [];
        const find = (kind: LegalPageKind) => readLegalPage(kind, rows.find((row) => row.key === LEGAL_SETTING_KEYS[kind])?.value);
        if (active) setPages({ privacy: find("privacy"), terms: find("terms") });
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load the legal pages.");
      }
    })();
    return () => { active = false; };
  }, []);

  return <div className="admin-content">
    <div className="admin-page-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />UNITED TIGERS CMS</span><h1>Legal pages</h1><p>The Privacy and Terms pages linked in the website footer. Edit the text and save; the public page updates straight away.</p></div></div>
    {error && <div className="admin-demo-alert"><AlertTriangle size={14} />{error}</div>}
    {!pages && !error && <div className="admin-table-wrap"><div className="admin-loading-inline"><span className="admin-spinner" /> LOADING PAGES</div></div>}
    {pages && kinds.map(({ kind, heading, path }) => <LegalPageForm key={kind} kind={kind} heading={heading} path={path} initial={pages[kind]} />)}
  </div>;
}
