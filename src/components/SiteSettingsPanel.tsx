"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check } from "lucide-react";

type SettingRow = { key: string; value: unknown };
type StorageValue = { endpoint?: string; bucket?: string; region?: string; publicUrl?: string; hasAccessKey?: boolean; hasSecretKey?: boolean };

const empty = { siteUrl: "http://localhost:3000", livePollIntervalMs: "15000", endpoint: "", bucket: "", region: "auto", publicUrl: "", accessKey: "", secretKey: "" };

export function SiteSettingsPanel() {
  const [form, setForm] = useState(empty);
  const [savedSecrets, setSavedSecrets] = useState({ access: false, secret: false });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const response = await fetch("/api/v1/admin/settings", { cache: "no-store" });
      const result = await response.json();
      if (!active || !response.ok || !Array.isArray(result.data)) return;
      const rows = result.data as SettingRow[];
      const siteUrl = rows.find((row) => row.key === "siteUrl");
      const interval = rows.find((row) => row.key === "livePollIntervalMs");
      const storage = rows.find((row) => row.key === "storage");
      const storageValue = storage?.value && typeof storage.value === "object" ? storage.value as StorageValue : {};
      setSavedSecrets({ access: Boolean(storageValue.hasAccessKey), secret: Boolean(storageValue.hasSecretKey) });
      setForm({
        siteUrl: typeof siteUrl?.value === "string" ? siteUrl.value : empty.siteUrl,
        livePollIntervalMs: typeof interval?.value === "number" ? String(interval.value) : empty.livePollIntervalMs,
        endpoint: storageValue.endpoint ?? "",
        bucket: storageValue.bucket ?? "",
        region: storageValue.region || "auto",
        publicUrl: storageValue.publicUrl ?? "",
        accessKey: "",
        secretKey: "",
      });
    })();
    return () => { active = false; };
  }, []);

  function change(key: keyof typeof empty, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const payloads = [
      { key: "siteUrl", value: form.siteUrl.trim() },
      { key: "livePollIntervalMs", value: Number(form.livePollIntervalMs) },
      { key: "storage", value: { endpoint: form.endpoint.trim(), bucket: form.bucket.trim(), region: form.region.trim() || "auto", publicUrl: form.publicUrl.trim(), accessKey: form.accessKey, secretKey: form.secretKey } },
    ];
    try {
      for (const payload of payloads) {
        const response = await fetch("/api/v1/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not save site settings.");
      }
      setSavedSecrets((current) => ({ access: current.access || Boolean(form.accessKey), secret: current.secret || Boolean(form.secretKey) }));
      setForm((current) => ({ ...current, accessKey: "", secretKey: "" }));
      setNotice("Site settings saved. Public pages use these values on the next request.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save site settings.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-editor" onSubmit={save}>
    <div className="admin-panel-header"><h2>Site configuration</h2></div>
    <p className="admin-storage-note">Canonical URL, live-score polling and media storage are saved here. The environment file only needs the database URL, the session secret and the first admin account.</p>
    {error && <p className="form-status form-status-error">{error}</p>}
    {notice && <p className="admin-notice"><Check size={13} /> {notice}</p>}
    <div className="admin-editor-grid">
      <label>Canonical site URL<input value={form.siteUrl} onChange={(event) => change("siteUrl", event.target.value)} required placeholder="https://unitedtigers.ae" /><small>Used for metadata, the sitemap and share links.</small></label>
      <label>Live score poll interval (ms)<input type="number" min={5000} max={60000} step={1000} value={form.livePollIntervalMs} onChange={(event) => change("livePollIntervalMs", event.target.value)} required /><small>Between 5 and 60 seconds.</small></label>
      <label>Storage endpoint<input value={form.endpoint} onChange={(event) => change("endpoint", event.target.value)} placeholder="https://account.r2.cloudflarestorage.com" /><small>S3-compatible API endpoint for uploads.</small></label>
      <label>Storage bucket<input value={form.bucket} onChange={(event) => change("bucket", event.target.value)} /></label>
      <label>Storage region<input value={form.region} onChange={(event) => change("region", event.target.value)} placeholder="auto" /></label>
      <label>Public file URL<input value={form.publicUrl} onChange={(event) => change("publicUrl", event.target.value)} placeholder="https://media.unitedtigers.ae" /><small>Optional. Used when the bucket endpoint is not public.</small></label>
      <label>Storage access key<input value={form.accessKey} onChange={(event) => change("accessKey", event.target.value)} autoComplete="off" placeholder={savedSecrets.access ? "Saved — leave blank to keep" : ""} /></label>
      <label>Storage secret key<input type="password" value={form.secretKey} onChange={(event) => change("secretKey", event.target.value)} autoComplete="new-password" placeholder={savedSecrets.secret ? "Saved — leave blank to keep" : ""} /></label>
    </div>
    <div className="admin-editor-actions"><button className="admin-primary-btn" type="submit" disabled={busy}>{busy ? "SAVING…" : "SAVE SITE SETTINGS"}</button></div>
  </form>;
}
