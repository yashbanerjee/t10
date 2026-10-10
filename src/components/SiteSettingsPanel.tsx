"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check } from "lucide-react";

type SettingRow = { key: string; value: unknown };
type StorageValue = { endpoint?: string; bucket?: string; region?: string; publicUrl?: string; hasAccessKey?: boolean; hasSecretKey?: boolean };
type SmtpValue = { host?: string; port?: number; secure?: boolean; user?: string; fromEmail?: string; fromName?: string; adminEmail?: string; hasPassword?: boolean };
type PlayerOption = { id: string; fullName: string; profileImage: string | null; isActive: boolean; isDemo: boolean };

const FEATURED_PLAYER_LIMIT = 5;
const empty = { siteUrl: "http://localhost:3000", livePollIntervalMs: "15000", endpoint: "", bucket: "", region: "auto", publicUrl: "", accessKey: "", secretKey: "" };
const smtpEmpty = { host: "", port: "587", secure: false, user: "", password: "", fromEmail: "", fromName: "United Tigers", adminEmail: "" };
const stripeEmpty = { enabled: false, publishableKey: "", secretKey: "", webhookSecret: "", currency: "AED", removeKeys: false };
type StripeValue = { enabled?: boolean; publishableKey?: string; currency?: string; hasSecretKey?: boolean; hasWebhookSecret?: boolean; mode?: string };
const bannerEmpty = { mode: "static", title: "THE NEXT GAME", accent: "STARTS HERE", tagline: "BIGGER BOLDER TOGETHER", ctaLabel: "BACK OUR TIGERS", ctaHref: "/team", image: "", roar: "LET’S GO HUNT", showPlayers: true, players: [] as string[] };

export function SiteSettingsPanel() {
  const [form, setForm] = useState(empty);
  const [smtp, setSmtp] = useState(smtpEmpty);
  const [banner, setBanner] = useState(bannerEmpty);
  const [roster, setRoster] = useState<PlayerOption[]>([]);
  const [brochure, setBrochure] = useState("");
  const [savedSecrets, setSavedSecrets] = useState({ access: false, secret: false, mail: false });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stripe, setStripe] = useState(stripeEmpty);
  const [stripeSaved, setStripeSaved] = useState({ secret: false, webhook: false, mode: "" });
  const [stripeCheck, setStripeCheck] = useState<{ ok: boolean; message: string } | null>(null);
  const [checkingStripe, setCheckingStripe] = useState(false);

  async function checkStripe() {
    setCheckingStripe(true); setStripeCheck(null);
    try {
      const response = await fetch("/api/v1/admin/stripe/test", { method: "POST" });
      const result = await response.json().catch(() => null);
      setStripeCheck({ ok: response.ok, message: result?.message || (response.ok ? "Stripe keys work." : "Stripe check failed.") });
    } catch {
      setStripeCheck({ ok: false, message: "Stripe check failed: the server could not be reached." });
    } finally {
      setCheckingStripe(false);
    }
  }
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function sendTest() {
    setTesting(true); setTestResult(null);
    try {
      const response = await fetch("/api/v1/admin/mail/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to: testTo.trim() }) });
      const result = await response.json().catch(() => null);
      setTestResult({ ok: response.ok, message: result?.message || (response.ok ? "Test email sent." : "Test email failed.") });
    } catch {
      setTestResult({ ok: false, message: "Test email failed: the server could not be reached." });
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      const playersResponse = await fetch("/api/v1/admin/players", { cache: "no-store" }).catch(() => null);
      const playersResult = playersResponse ? await playersResponse.json().catch(() => null) : null;
      if (active && playersResponse?.ok && Array.isArray(playersResult?.data)) {
        setRoster((playersResult.data as Partial<PlayerOption>[]).filter((player) => typeof player.id === "string" && typeof player.fullName === "string").map((player) => ({ id: player.id!, fullName: player.fullName!, profileImage: typeof player.profileImage === "string" ? player.profileImage : null, isActive: player.isActive !== false, isDemo: player.isDemo === true })));
      }
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
        showPlayers: savedBanner.showPlayers !== false,
        players: Array.isArray(savedBanner.players) ? savedBanner.players.filter((id): id is string => typeof id === "string").slice(0, FEATURED_PLAYER_LIMIT) : [],
      });
      const savedBrochure = rows.find((row) => row.key === "partnerBrochure");
      setBrochure(typeof savedBrochure?.value === "string" ? savedBrochure.value : "");
      const stripeRow = rows.find((row) => row.key === "stripe");
      const stripeValue = stripeRow?.value && typeof stripeRow.value === "object" && !Array.isArray(stripeRow.value) ? stripeRow.value as StripeValue : {};
      setStripe({ ...stripeEmpty, enabled: Boolean(stripeValue.enabled), publishableKey: stripeValue.publishableKey ?? "", currency: (stripeValue.currency || "aed").toUpperCase() });
      setStripeSaved({ secret: Boolean(stripeValue.hasSecretKey), webhook: Boolean(stripeValue.hasWebhookSecret), mode: stripeValue.mode ?? "" });
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

  function togglePlayer(id: string, checked: boolean) {
    setBanner((current) => ({ ...current, players: checked ? [...current.players.filter((entry) => entry !== id), id].slice(0, FEATURED_PLAYER_LIMIT) : current.players.filter((entry) => entry !== id) }));
  }

  const selectable = roster.filter((player) => player.isActive && !player.isDemo);
  const limitReached = banner.players.length >= FEATURED_PLAYER_LIMIT;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const payloads = [
      { key: "siteUrl", value: form.siteUrl.trim() },
      { key: "livePollIntervalMs", value: Number(form.livePollIntervalMs) },
      { key: "storage", value: { endpoint: form.endpoint.trim(), bucket: form.bucket.trim(), region: form.region.trim() || "auto", publicUrl: form.publicUrl.trim(), accessKey: form.accessKey, secretKey: form.secretKey } },
      { key: "homepage", value: banner },
      { key: "partnerBrochure", value: brochure.trim() },
      { key: "smtp", value: { host: smtp.host.trim(), port: Number(smtp.port), secure: smtp.secure, user: smtp.user.trim(), password: smtp.password, fromEmail: smtp.fromEmail.trim(), fromName: smtp.fromName.trim(), adminEmail: smtp.adminEmail.trim() } },
      { key: "stripe", value: { enabled: stripe.removeKeys ? false : stripe.enabled, publishableKey: stripe.publishableKey.trim(), secretKey: stripe.secretKey.trim(), webhookSecret: stripe.webhookSecret.trim(), currency: stripe.currency.trim() || "AED", removeKeys: stripe.removeKeys } },
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
      setStripeSaved((current) => stripe.removeKeys ? { secret: false, webhook: false, mode: "" } : { secret: current.secret || Boolean(stripe.secretKey.trim()), webhook: current.webhook || Boolean(stripe.webhookSecret.trim()), mode: stripe.secretKey.trim() ? (stripe.secretKey.includes("_live_") ? "live" : "test") : current.mode });
      setStripe((current) => current.removeKeys ? { ...stripeEmpty } : { ...current, secretKey: "", webhookSecret: "" });
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
    <div className="admin-panel-header"><h2>Partner brochure</h2></div>
    <p className="admin-storage-note">Upload the PDF that visitors download after they submit the Become a partner form. Choose the file, then save site settings. Requests are listed under Partner requests.</p>
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">Upload brochure</span><span className="admin-field-control"><input type="file" accept="application/pdf,.pdf" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const body = new FormData();
        body.set("file", file);
        body.set("folder", "brochures");
        const response = await fetch("/api/v1/admin/media/upload", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) { setError(result.message || "Upload failed. Paste a brochure link instead."); return; }
        setBrochure(result.data.url);
        setNotice("Brochure uploaded. Save site settings to publish it.");
      }} /></span><span className="admin-field-note">PDF, up to 25 MB.</span></label>
      <label className="admin-field"><span className="admin-field-label">Brochure file</span><span className="admin-field-control"><input value={brochure} onChange={(event) => setBrochure(event.target.value)} placeholder="/media/uploads/…/brochure.pdf" /></span><span className="admin-field-note">{brochure ? <a href={brochure} target="_blank" rel="noreferrer">Open the current brochure</a> : "No brochure yet. Visitors are told the team will email it."}</span></label>
    </div>
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">Canonical site URL</span><span className="admin-field-control"><input value={form.siteUrl} onChange={(event) => change("siteUrl", event.target.value)} required placeholder="https://unitedtigers.ae" /></span><span className="admin-field-note">Used for metadata, the sitemap and share links.</span></label>
      <label className="admin-field"><span className="admin-field-label">Live score poll interval (ms)</span><span className="admin-field-control"><input type="number" min={5000} max={60000} step={1000} value={form.livePollIntervalMs} onChange={(event) => change("livePollIntervalMs", event.target.value)} required /></span><span className="admin-field-note">Between 5 and 60 seconds.</span></label>
      <label className="admin-field"><span className="admin-field-label">Storage endpoint</span><span className="admin-field-control"><input value={form.endpoint} onChange={(event) => change("endpoint", event.target.value)} placeholder="https://account.r2.cloudflarestorage.com" /></span><span className="admin-field-note">S3-compatible API endpoint for uploads.</span></label>
      <label className="admin-field"><span className="admin-field-label">Storage bucket</span><span className="admin-field-control"><input value={form.bucket} onChange={(event) => change("bucket", event.target.value)} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Storage region</span><span className="admin-field-control"><input value={form.region} onChange={(event) => change("region", event.target.value)} placeholder="auto" /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Public file URL</span><span className="admin-field-control"><input value={form.publicUrl} onChange={(event) => change("publicUrl", event.target.value)} placeholder="https://media.unitedtigers.ae" /></span><span className="admin-field-note">Optional, for buckets that are publicly readable, for example https://bucket.t3.storageapi.dev. Uploads that are not public are served through this website automatically.</span></label>
      <label className="admin-field"><span className="admin-field-label">Storage access key</span><span className="admin-field-control"><input value={form.accessKey} onChange={(event) => change("accessKey", event.target.value)} autoComplete="off" placeholder={savedSecrets.access ? "Saved — leave blank to keep" : ""} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">Storage secret key</span><span className="admin-field-control"><input type="password" value={form.secretKey} onChange={(event) => change("secretKey", event.target.value)} autoComplete="new-password" placeholder={savedSecrets.secret ? "Saved — leave blank to keep" : ""} /></span><span className="admin-field-note" /></label>
    </div>
    <div className="admin-panel-header"><h2>Outgoing mail</h2></div>
    <p className="admin-storage-note">Contact messages are emailed to the admin address. Shop bookings, poll votes and contest entries are emailed to that address and to the person who submitted them. Mail is sent directly through the SMTP server below.</p>
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">SMTP host</span><span className="admin-field-control"><input value={smtp.host} onChange={(event) => setSmtp((current) => ({ ...current, host: event.target.value }))} placeholder="smtp.example.com" /></span><span className="admin-field-note">Leave blank to keep mail turned off.</span></label>
      <label className="admin-field"><span className="admin-field-label">SMTP port</span><span className="admin-field-control"><input type="number" min={1} max={65535} value={smtp.port} onChange={(event) => setSmtp((current) => ({ ...current, port: event.target.value }))} required /></span><span className="admin-field-note">587 for STARTTLS, 465 for SSL.</span></label>
      <label className="admin-field"><span className="admin-field-label">SMTP username</span><span className="admin-field-control"><input value={smtp.user} onChange={(event) => setSmtp((current) => ({ ...current, user: event.target.value }))} autoComplete="off" /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">SMTP password</span><span className="admin-field-control"><input type="password" value={smtp.password} onChange={(event) => setSmtp((current) => ({ ...current, password: event.target.value }))} autoComplete="new-password" placeholder={savedSecrets.mail ? "Saved — leave blank to keep" : ""} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">From name</span><span className="admin-field-control"><input value={smtp.fromName} onChange={(event) => setSmtp((current) => ({ ...current, fromName: event.target.value }))} /></span><span className="admin-field-note" /></label>
      <label className="admin-field"><span className="admin-field-label">From email</span><span className="admin-field-control"><input type="email" value={smtp.fromEmail} onChange={(event) => setSmtp((current) => ({ ...current, fromEmail: event.target.value }))} placeholder="info@unitedtigers.ae" /></span><span className="admin-field-note">Address fans see as the sender.</span></label>
      <label className="admin-field"><span className="admin-field-label">Admin email</span><span className="admin-field-control"><input value={smtp.adminEmail} onChange={(event) => setSmtp((current) => ({ ...current, adminEmail: event.target.value }))} placeholder="manager@example.com, sales@example.com" autoComplete="off" /></span><span className="admin-field-note">{!smtp.adminEmail.trim() || smtp.adminEmail.trim().toLowerCase() === smtp.fromEmail.trim().toLowerCase() ? <strong className="form-status form-status-error">No separate admin inbox. Notifications are sent from the from email to itself, and many mail servers file those only under Sent. Add a different address here.</strong> : "Receives every contact, booking, payment, vote, contest and partner notification. Separate several addresses with commas."}</span></label>
      <label className="admin-field"><span className="admin-field-label">Use SSL</span><span className="admin-field-control"><input type="checkbox" checked={smtp.secure} onChange={(event) => setSmtp((current) => ({ ...current, secure: event.target.checked }))} /></span><span className="admin-field-note">Turn on for port 465.</span></label>
      <label className="admin-field"><span className="admin-field-label">Send test email to</span><span className="admin-field-control"><input type="email" value={testTo} onChange={(event) => setTestTo(event.target.value)} placeholder={smtp.adminEmail || "you@example.com"} /></span><span className="admin-field-note">Uses the saved settings, so save first. Blank sends to the admin email.</span></label>
      <div className="admin-field"><span className="admin-field-label">Test mail</span><span className="admin-field-control"><button className="admin-primary-btn" type="button" onClick={sendTest} disabled={testing || busy}>{testing ? "SENDING…" : "SEND TEST EMAIL"}</button></span><span className="admin-field-note">{testResult ? <span className={testResult.ok ? "admin-notice" : "form-status form-status-error"}>{testResult.ok ? <Check size={13} /> : null} {testResult.message}</span> : "Checks the connection and sends one short message."}</span></div>
    </div>
    <div className="admin-panel-header"><h2>Online payments (Stripe)</h2></div>
    <p className="admin-storage-note">When turned on, fans pay for shop orders by card on Stripe’s secure checkout page and the order is marked paid automatically. When off, orders are booked and the club confirms payment by phone or email. Find your keys in the Stripe Dashboard under Developers → API keys.{stripeSaved.mode ? <> <strong>Saved keys: {stripeSaved.mode === "live" ? "LIVE mode — real cards are charged." : "TEST mode — use Stripe test cards."}</strong></> : null}</p>
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">Accept online payments</span><span className="admin-field-control"><input type="checkbox" checked={stripe.enabled} disabled={stripe.removeKeys} onChange={(event) => setStripe((current) => ({ ...current, enabled: event.target.checked }))} /></span><span className="admin-field-note">{stripe.enabled ? "Checkout sends fans to Stripe to pay." : "Checkout books orders without payment."}</span></label>
      <label className="admin-field"><span className="admin-field-label">Publishable key</span><span className="admin-field-control"><input value={stripe.publishableKey} onChange={(event) => setStripe((current) => ({ ...current, publishableKey: event.target.value, removeKeys: false }))} placeholder="pk_live_… or pk_test_…" autoComplete="off" spellCheck={false} /></span><span className="admin-field-note">Starts with pk_.</span></label>
      <label className="admin-field"><span className="admin-field-label">Secret key</span><span className="admin-field-control"><input type="password" value={stripe.secretKey} onChange={(event) => setStripe((current) => ({ ...current, secretKey: event.target.value, removeKeys: false }))} placeholder={stripeSaved.secret && !stripe.removeKeys ? "Saved — leave blank to keep" : "sk_live_… or sk_test_…"} autoComplete="new-password" /></span><span className="admin-field-note">Starts with sk_ (or a restricted rk_ key). Never shown again after saving.</span></label>
      <label className="admin-field"><span className="admin-field-label">Webhook signing secret</span><span className="admin-field-control"><input type="password" value={stripe.webhookSecret} onChange={(event) => setStripe((current) => ({ ...current, webhookSecret: event.target.value, removeKeys: false }))} placeholder={stripeSaved.webhook && !stripe.removeKeys ? "Saved — leave blank to keep" : "whsec_…"} autoComplete="new-password" /></span><span className="admin-field-note">Recommended. In Stripe → Developers → Webhooks, add the endpoint <code>{`${form.siteUrl.replace(/\/$/, "")}/api/v1/shop/stripe/webhook`}</code> with the events checkout.session.completed, checkout.session.expired, checkout.session.async_payment_succeeded and checkout.session.async_payment_failed, then paste its signing secret here.</span></label>
      <label className="admin-field"><span className="admin-field-label">Currency</span><span className="admin-field-control"><input value={stripe.currency} maxLength={3} onChange={(event) => setStripe((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} /></span><span className="admin-field-note">Three-letter code. Shop prices are in AED.</span></label>
      <div className="admin-field"><span className="admin-field-label">Check keys</span><span className="admin-field-control"><button className="admin-primary-btn" type="button" onClick={checkStripe} disabled={checkingStripe || busy}>{checkingStripe ? "CHECKING…" : "CHECK STRIPE KEYS"}</button></span><span className="admin-field-note">{stripeCheck ? <span className={stripeCheck.ok ? "admin-notice" : "form-status form-status-error"}>{stripeCheck.ok ? <Check size={13} /> : null} {stripeCheck.message}</span> : "Uses the saved keys, so save first."}{stripeSaved.secret ? <> <label><input type="checkbox" checked={stripe.removeKeys} onChange={(event) => setStripe((current) => ({ ...current, removeKeys: event.target.checked, enabled: event.target.checked ? false : current.enabled }))} /> Remove saved Stripe keys</label></> : null}</span></div>
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
      <label className="admin-field"><span className="admin-field-label">Background image</span><span className="admin-field-control"><input value={banner.image} onChange={(event) => setBanner((current) => ({ ...current, image: event.target.value }))} placeholder="/images/stadium-hero.png" /></span><span className="admin-field-note">{banner.image && /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(banner.image) ? <img className="admin-upload-preview" src={banner.image} alt="" /> : null}Wide photo, about 1600×700. Paste a path or URL, or upload below.</span></label>
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
    <div className="admin-panel-header"><h2>Featured players</h2></div>
    <p className="admin-storage-note">The row of player photos beside the headline on the homepage, on every screen size. Turn it off to hide the row, or tick up to {FEATURED_PLAYER_LIMIT} players to choose who appears. With nobody ticked, the first {FEATURED_PLAYER_LIMIT} players with a photo are shown in squad order.</p>
    <div className="admin-editor-grid">
      <label className="admin-field"><span className="admin-field-label">Show featured players</span><span className="admin-field-control"><input type="checkbox" checked={banner.showPlayers} onChange={(event) => setBanner((current) => ({ ...current, showPlayers: event.target.checked }))} /></span><span className="admin-field-note">{banner.showPlayers ? "The row is visible on the homepage." : "The row is hidden on the homepage."}</span></label>
    </div>
    {selectable.length > 0 && <div className="admin-checks" aria-label="Featured players">
      {selectable.map((player) => {
        const checked = banner.players.includes(player.id);
        const disabled = !banner.showPlayers || !player.profileImage || (!checked && limitReached);
        return <label key={player.id} title={!player.profileImage ? "Add a profile photo to feature this player" : undefined}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => togglePlayer(player.id, event.target.checked)} /><span>{player.fullName}{!player.profileImage ? " (no photo yet)" : ""}</span></label>;
      })}
    </div>}
    <p className="admin-field-note">{banner.players.length ? `${banner.players.length} of ${FEATURED_PLAYER_LIMIT} chosen. Players appear in squad order; the middle one stands tallest.` : `Nobody chosen yet, so the first ${FEATURED_PLAYER_LIMIT} players with a photo are used.`}</p>
    <div className="admin-editor-actions"><button className="admin-primary-btn" type="submit" disabled={busy}>{busy ? "SAVING…" : "SAVE SITE SETTINGS"}</button></div>
  </form>;
}
