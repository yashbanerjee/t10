import { getSiteUrl } from "@/lib/site-settings";

export type MailContent = { subject: string; html: string; text: string };

export type EmailLine = { label: string; value: string };

export type EmailOptions = {
  subject: string;
  /** Short line shown in the inbox preview. */
  preheader: string;
  eyebrow: string;
  title: string;
  greeting?: string;
  intro: string;
  details?: EmailLine[];
  /** Order lines: name on the left, amount on the right. */
  items?: EmailLine[];
  total?: EmailLine;
  message?: { label: string; body: string };
  cta?: { label: string; href: string };
  note?: string;
};

const colors = {
  page: "#1A0533",
  card: "#2B0A55",
  panel: "#3A0F6E",
  line: "#5B2A92",
  gold: "#D2A95A",
  goldLight: "#F4DB96",
  pink: "#C9177E",
  cyan: "#3FD8FF",
  text: "#F3ECFF",
  muted: "#BFB0DA",
};

const display = "'Arial Black', Impact, 'Arial Narrow', sans-serif";
const body = "'Exo 2', 'Segoe UI', Roboto, Arial, sans-serif";

function escape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function multiline(value: string) {
  return escape(value).replaceAll("\n", "<br>");
}

function absolute(siteUrl: string, href: string) {
  return /^https?:\/\//.test(href) ? href : `${siteUrl}${href.startsWith("/") ? "" : "/"}${href}`;
}

function rowsTable(lines: EmailLine[], alignValue: "left" | "right") {
  return lines.map((line, index) => `<tr>
    <td style="padding:12px 0;${index ? `border-top:1px solid ${colors.line};` : ""}font:700 11px/1.4 ${body};letter-spacing:.12em;text-transform:uppercase;color:${colors.gold};vertical-align:top;width:${alignValue === "left" ? "38%" : "auto"};">${escape(line.label)}</td>
    <td style="padding:12px 0;${index ? `border-top:1px solid ${colors.line};` : ""}font:500 15px/1.5 ${body};color:${colors.text};text-align:${alignValue};vertical-align:top;">${multiline(line.value)}</td>
  </tr>`).join("");
}

function panel(inner: string) {
  return `<tr><td style="padding:0 32px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.panel};border:1px solid ${colors.line};border-radius:14px;"><tr><td style="padding:6px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inner}</table>
  </td></tr></table></td></tr>`;
}

export async function renderEmail(options: EmailOptions): Promise<MailContent> {
  const siteUrl = await getSiteUrl();
  const logo = `${siteUrl}/brand/teams/united-tigers.png`;
  const year = new Date().getFullYear();

  const sections: string[] = [];
  if (options.details?.length) sections.push(panel(rowsTable(options.details, "left")));
  if (options.items?.length) {
    const total = options.total ? `<tr>
      <td style="padding:14px 0 12px;border-top:2px solid ${colors.gold};font:900 14px/1.3 ${display};letter-spacing:.06em;text-transform:uppercase;color:${colors.goldLight};">${escape(options.total.label)}</td>
      <td style="padding:14px 0 12px;border-top:2px solid ${colors.gold};font:900 18px/1.3 ${display};color:${colors.goldLight};text-align:right;">${escape(options.total.value)}</td>
    </tr>` : "";
    sections.push(panel(rowsTable(options.items, "right") + total));
  }
  if (options.message) {
    sections.push(`<tr><td style="padding:0 32px 22px;">
      <p style="margin:0 0 8px;font:700 11px/1.4 ${body};letter-spacing:.12em;text-transform:uppercase;color:${colors.gold};">${escape(options.message.label)}</p>
      <div style="padding:16px 18px;background:${colors.panel};border-left:3px solid ${colors.pink};border-radius:0 12px 12px 0;font:400 15px/1.6 ${body};color:${colors.text};">${multiline(options.message.body)}</div>
    </td></tr>`);
  }
  const cta = options.cta ? `<tr><td align="center" style="padding:6px 32px 28px;">
    <a href="${escape(absolute(siteUrl, options.cta.href))}" style="display:inline-block;padding:14px 30px;border-radius:999px;background:${colors.pink};background-image:linear-gradient(90deg,${colors.pink},#8A2BE2);color:#FFFFFF;font:900 13px/1 ${display};letter-spacing:.1em;text-transform:uppercase;text-decoration:none;box-shadow:0 0 18px rgba(201,23,126,.55);">${escape(options.cta.label)}</a>
  </td></tr>` : "";
  const note = options.note ? `<tr><td style="padding:0 32px 26px;font:400 13px/1.6 ${body};color:${colors.muted};">${multiline(options.note)}</td></tr>` : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escape(options.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;700;900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${colors.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${colors.page};">${escape(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.page};background-image:radial-gradient(ellipse at 15% 0%,rgba(201,23,126,.35),transparent 55%),radial-gradient(ellipse at 90% 100%,rgba(63,216,255,.18),transparent 55%);">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${colors.card};border:1px solid ${colors.line};border-radius:20px;overflow:hidden;">
    <tr><td style="height:4px;background:${colors.gold};background-image:linear-gradient(90deg,${colors.cyan},${colors.pink},${colors.gold});font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td align="center" style="padding:28px 32px 8px;background-image:radial-gradient(circle at 50% 40%,rgba(201,23,126,.45),transparent 65%);">
      <a href="${escape(siteUrl)}" style="text-decoration:none;"><img src="${escape(logo)}" width="96" alt="UNITED TIGERS" style="display:block;width:96px;max-width:96px;height:auto;border:0;color:${colors.goldLight};font:900 20px/1.2 ${display};letter-spacing:.08em;"></a>
    </td></tr>
    <tr><td align="center" style="padding:14px 32px 6px;font:700 11px/1.4 ${body};letter-spacing:.22em;text-transform:uppercase;color:${colors.cyan};">&#9679; ${escape(options.eyebrow)}</td></tr>
    <tr><td align="center" style="padding:0 32px 20px;font:900 30px/1.1 ${display};letter-spacing:.04em;text-transform:uppercase;color:${colors.goldLight};text-shadow:0 0 22px rgba(201,23,126,.6);">${escape(options.title)}</td></tr>
    <tr><td style="padding:0 32px 22px;font:400 16px/1.6 ${body};color:${colors.text};">
      ${options.greeting ? `<p style="margin:0 0 10px;font-weight:700;">${escape(options.greeting)}</p>` : ""}
      <p style="margin:0;">${multiline(options.intro)}</p>
    </td></tr>
    ${sections.join("\n")}
    ${cta}
    ${note}
    <tr><td style="padding:22px 32px;background:#1F0640;border-top:1px solid ${colors.line};" align="center">
      <p style="margin:0 0 6px;font:900 14px/1.3 ${display};letter-spacing:.14em;text-transform:uppercase;color:${colors.gold};">Let&#8217;s Go Hunt</p>
      <p style="margin:0 0 10px;font:400 12px/1.6 ${body};color:${colors.muted};">United Tigers &middot; Abu Dhabi T10 &middot; United Arab Emirates</p>
      <p style="margin:0;font:400 12px/1.6 ${body};"><a href="https://www.facebook.com/share/1Bxhkk4L97/" style="color:${colors.cyan};text-decoration:none;">Facebook</a> &nbsp;&middot;&nbsp; <a href="https://www.instagram.com/unitedtigers.ae" style="color:${colors.cyan};text-decoration:none;">Instagram</a> &nbsp;&middot;&nbsp; <a href="${escape(siteUrl)}" style="color:${colors.cyan};text-decoration:none;">Website</a></p>
      <p style="margin:12px 0 0;font:400 11px/1.5 ${body};color:#8E7BB0;">&copy; ${year} United Tigers. All rights reserved.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    options.title,
    "",
    options.greeting ?? "",
    options.intro,
    "",
    ...(options.details ?? []).map((line) => `${line.label}: ${line.value}`),
    ...(options.items?.length ? ["", ...options.items.map((line) => `${line.label} — ${line.value}`)] : []),
    ...(options.total ? [`${options.total.label}: ${options.total.value}`] : []),
    ...(options.message ? ["", `${options.message.label}:`, options.message.body] : []),
    ...(options.cta ? ["", `${options.cta.label}: ${absolute(siteUrl, options.cta.href)}`] : []),
    ...(options.note ? ["", options.note] : []),
    "",
    "United Tigers · Let’s Go Hunt",
    siteUrl,
  ].join("\n").replace(/\n{3,}/g, "\n\n");

  return { subject: options.subject, html, text };
}
