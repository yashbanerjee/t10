"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check } from "lucide-react";

type SettingRow = { key: string; value: unknown };
type StorageValue = { endpoint?: string; bucket?: string; region?: string; publicUrl?: string; hasAccessKey?: boolean; hasSecretKey?: boolean };
type SmtpValue = { host?: string; port?: number; secure?: boolean; user?: string; fromEmail?: string; fromName?: string; adminEmail?: string; hasPassword?: boolean };

const empty = { siteUrl: "http://localhost:3000", livePollIntervalMs: "15000", endpoint: "", bucket: "", region: "auto", publicUrl: "", accessKey: "", secretKey: "" };
const smtpEmpty = { host: "", port: "587", secure: false, user: "", password: "", fromEmail: "", fromName: "United Tigers", adminEmail: "" };
const bannerEmpty = { mode: "static", title: "THE NEXT GAME", accent: "STARTS HERE", tagline: "BIGGER BOLDER TOGETHER", ctaLabel: "BACK OUR TIGERS", ctaHref: "/team", image: "", roar: "UNITED TIGERS" };

export function SiteSettingsPanel() {
  const [form, setForm] = useState(empty);
  const [smtp, setSmtp] = useState(smtpEmpty);
  const [banner, setBanner] = useState(bannerEmpty);
  const [savedSecrets, setSavedSecrets] = useState({ access: false, secret: false, mail: false });
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
      const homepage = rows.find((row) => row.key === "homepage");
      const savedBanner = homepage?.value && typeof homepage.value === "object" && !Array.isArray(homepage.value) ? homepage.value as Record<string, unknown> : {};
      setBanner({
        mode: savedBanner.mode === "image" ? "image" : "static",
        title: typeof savedBanner.title === "string" ? savedBanner.title : bannerEmpty.title,
        accent: typeof savedBanner.accent === "string" ? savedBanner.accent : bannerEmpty.accent,
        tagline: typeof savedBanner.tagline === "string" ? savedBanner.tagline : bannerEmpty.tagline,
        ctaLabel: typeof savedBanner.ctaLabel === "string" ? savedBanner.ctaLabel : bannerEmpty.ctaLabel,
        ctaHref: typeof savedBanner.ctaHref === "string" ? savedBanner.ctaHref : bannerEmpty.ctaHref,
        image: typeof savedBanner.image === "string" ? savedBanner.image : "",
        roar: typeof savedBanner.roar === "string" ? savedBanner.roar : bannerEmpty.roar,
      });
      const mail = rows.find((row) => row.key === "smtp");
      const mailValue = mail?.value && typeof mail.value === "object" && !Array.isArray(mail.value) ? mail.value as SmtpValue : {};
      const storageValue = storage?.value && typeof storage.value === "object" ? storage.value as StorageValue : {};
      setSavedSecrets({ access: Boolean(storageValue.hasAccessKey), secret: Boolean(storageValue.hasSecretKey), mail: Boolean(mailValue.hasPassword) });
      setSmtp({
        host: mailValue.host ?? "",
        port: mailValue.port ? String(mailValue.port) : smtpEmpty.port,
        secure: Boolean(mailValue.secure),
        user: mailValue.user ?? "",
        password: "",
        fromEmail: mailValue.fromEmail ?? "",
        fromName: mailValue.fromName || smtpEmpty.fromName,
        adminEmail: mailValue.adminEmail ?? "",
      });
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
      { key: "homepage", value: banner },
      { key: "smtp", value: { host: smtp.host.trim(), port: Number(smtp.port), secure: smtp.secure, user: smtp.user.trim(), password: smtp.password, fromEmail: smtp.fromEmail.trim(), fromName: smtp.fromName.trim(), adminEmail: smtp.adminEmail.trim() } },
    ];
    try {
      for (const payload of payloads) {
        const response = await fetch("/api/v1/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not save site settings.");
      }
      setSavedSecrets((current) => ({ access: current.access || Boolean(form.accessKey), secret: current.secret || Boolean(form.secretKey), mail: current.mail || Boolean(smtp.password) }));
      setForm((current) => ({ ...current, accessKey: "", secretKey: "" }));
      setSmtp((current) => ({ ...current, password: "" }));
      setNotice("Site settings saved. Public pages use these values on the next request.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save site settings.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="admin-editor" onSubmit={save}>
    <div className="admin-panel-header"><h2>Site configuration</h2></div>
    <p className="admin-storage-note">Canonical URL, live-score polling, media storage and outgoing mail are saved here. The environment file only needs the database URL, the session secret and the first admin account.</p>
    {error && <p className="form-status form-status-error">{error}</p>}
    {notice && <p className="admin-notice"><Check size={13} /> {notice}</p>}
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">Canonical site URL</span><span className="admin-field-control"><input value={form.siteUrl} onChange={(event) => change("siteUrl", event.target.value)} required placeholder="https://unitedtigers.ae" /></span><span className="admin-field-note">Used for metadata, the sitemap and share links.</span></label>
      <label className="admin-field"><span className="admin-field-label">Live score poll interval (ms)</span><span className="admin-field-control"><input type="number" min={5000} max={60000} step={1000} value={form.livePollIntervalMs} onChange={(event) => change("livePollIntervalMs", event.target.value)} required /></span><span className="admin-field-note">Between 5 and 60 seconds.</span></label>
      <label className="admin-field"><span className="admin-field-label">Storage endpoint</span><span className="admin-field-control"><input value={form.endpoint} onChange={(event) => change("endpoint", event.target.value)} placeholder="https://account.r2.cloudflarestorage.com" /></span><span className="admin-field-note">S3-compatible API endpoint for uploads.</span></label>
      <label className="admin-field"><span className="admin-field-label">Storage bucket</span><span className="admin-field-control"><input value={form.bucket} onChange={(event) => change("bucket", event.target.value)} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Storage region</span><span className="admin-field-control"><input value={form.region} onChange={(event) => change("region", event.target.value)} placeholder="auto" /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Public file URL</span><span className="admin-field-control"><input value={form.publicUrl} onChange={(event) => change("publicUrl", event.target.value)} placeholder="https://media.unitedtigers.ae" /></span><span className="admin-field-note">Optional. Used when the bucket endpoint is not public.</span></label>
      <label className="admin-field"><span className="admin-field-label">Storage access key</span><span className="admin-field-control"><input value={form.accessKey} onChange={(event) => change("accessKey", event.target.value)} autoComplete="off" placeholder={savedSecrets.access ? "Saved — leave blank to keep" : ""} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Storage secret key</span><span className="admin-field-control"><input type="password" value={form.secretKey} onChange={(event) => change("secretKey", event.target.value)} autoComplete="new-password" placeholder={savedSecrets.secret ? "Saved — leave blank to keep" : ""} /></span><span className="admin-field-note" /></label>
    </div>
    <div className="admin-panel-header"><h2>Outgoing mail</h2></div>
    <p className="admin-storage-note">Contact messages are emailed to the admin address. Shop bookings, poll votes and contest entries are emailed to that address and to the person who submitted them.</p>
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">SMTP host</span><span className="admin-field-control"><input value={smtp.host} onChange={(event) => setSmtp((current) => ({ ...current, host: event.target.value }))} placeholder="smtp.example.com" /></span><span className="admin-field-note">Leave blank to keep mail turned off.</span></label>
      <label className="admin-field"><span className="admin-field-label">SMTP port</span><span className="admin-field-control"><input type="number" min={1} max={65535} value={smtp.port} onChange={(event) => setSmtp((current) => ({ ...current, port: event.target.value }))} required /></span><span className="admin-field-note">587 for STARTTLS, 465 for SSL.</span></label>
      <label className="admin-field"><span className="admin-field-label">SMTP username</span><span className="admin-field-control"><input value={smtp.user} onChange={(event) => setSmtp((current) => ({ ...current, user: event.target.value }))} autoComplete="off" /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">SMTP password</span><span className="admin-field-control"><input type="password" value={smtp.password} onChange={(event) => setSmtp((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" placeholder={savedSecrets.mail ? "Saved — leave blank to keep" : ""} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">From name</span><span className="admin-field-control"><input value={smtp.fromName} onChange={(event) => setSmtp((current) => ({ ...current, fromName: event.target.value }))} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">From email</span><span className="admin-field-control"><input type="email" value={smtp.fromEmail} onChange={(event) => setSmtp((current) => ({ ...current, fromEmail: event.target.value }))} placeholder="info@unitedtigers.ae" /></span><span className="admin-field-note">Address fans see as the sender.</span></label>
      <label className="admin-field"><span className="admin-field-label">Admin email</span><span className="admin-field-control"><input type="email" value={smtp.adminEmail} onChange={(event) => setSmtp((current) => ({ ...current, adminEmail: event.target.value }))} placeholder="info@vedha.ae" /></span><span className="admin-field-note">Receives contact, booking, vote and contest mail.</span></label>
      <label className="admin-field"><span className="admin-field-label">Use SSL</span><span className="admin-field-control"><input type="checkbox" checked={smtp.secure} onChange={(event) => setSmtp((current) => ({ ...current, secure: event.target.checked }))} /></span><span className="admin-field-note">Turn on for port 465.</span></label>
    </div>
    <div className="admin-panel-header"><h2>Homepage banner</h2></div>
    <p className="admin-storage-note">The homepage hero uses one wide picture as its background. The headline sits on the left. Upload a new image here to replace the built-in stadium.</p>
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">Banner style</span><span className="admin-field-control"><select value={banner.mode} onChange={(event) => setBanner((current) => ({ ...current, mode: event.target.value === "image" ? "image" : "static" }))}><option value="static">Built-in stadium</option><option value="image">Custom background</option></select></span><span className="admin-field-note">Custom uses the image below as the full hero background.</span></label>
      <label className="admin-field"><span className="admin-field-label">Headline</span><span className="admin-field-control"><input value={banner.title} onChange={(event) => setBanner((current) => ({ ...current, title: event.target.value }))} required /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Orange line</span><span className="admin-field-control"><input value={banner.accent} onChange={(event) => setBanner((current) => ({ ...current, accent: event.target.value }))} required /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Tagline</span><span className="admin-field-control"><input value={banner.tagline} onChange={(event) => setBanner((current) => ({ ...current, tagline: event.target.value }))} required /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Button label</span><span className="admin-field-control"><input value={banner.ctaLabel} onChange={(event) => setBanner((current) => ({ ...current, ctaLabel: event.target.value }))} required /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Button link</span><span className="admin-field-control"><input value={banner.ctaHref} onChange={(event) => setBanner((current) => ({ ...current, ctaHref: event.target.value }))} required /></span><span className="admin-field-note">A site path such as /team, or a full URL.</span></label>
      <label className="admin-field"><span className="admin-field-label">Side line</span><span className="admin-field-control"><input value={banner.roar} onChange={(event) => setBanner((current) => ({ ...current, roar: event.target.value }))} /></span><span className="admin-field-note">Gold text on the right edge. Clear it if the picture already includes that line.</span></label>
      <label className="admin-field"><span className="admin-field-label">Background image</span><span className="admin-field-control"><input value={banner.image} onChange={(event) => setBanner((current) => ({ ...current, image: event.target.value }))} placeholder="/images/stadium-hero.png" /></span><span className="admin-field-note">Wide photo, about 1600×700. Paste a path or URL, or upload below.</span></label>
      <label className="admin-field"><span className="admin-field-label">Upload banner</span><span className="admin-field-control"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const body = new FormData();
        body.set("file", file);
        body.set("folder", "banners");
        const response = await fetch("/api/v1/admin/media/upload", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) { setError(result.message || "Upload failed. Paste an image path instead."); return; }
        setBanner((current) => ({ ...current, mode: "image", image: result.data.url }));
        setNotice("Banner image uploaded. Save site settings to publish it.");
      }} /></span><span className="admin-field-note" /></label>
    </div>
    <div className="admin-editor-actions"><button className="admin-primary-btn" type="submit" disabled={busy}>{busy ? "SAVING…" : "SAVE SITE SETTINGS"}</button></div>
  </form>;
}
