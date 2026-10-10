import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { renderEmail, type MailContent } from "@/lib/email-template";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  adminEmail: string;
};

async function readSmtp(): Promise<SmtpConfig | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "smtp" } });
    const value = row?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const port = Number(source.port);
    const user = typeof source.user === "string" ? source.user.trim() : "";
    const fromEmail = typeof source.fromEmail === "string" ? source.fromEmail.trim() : "";
    const adminEmail = typeof source.adminEmail === "string" ? source.adminEmail.trim() : "";
    return {
      host: typeof source.host === "string" ? source.host.trim() : "",
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure: source.secure === true || port === 465,
      user,
      password: typeof source.password === "string" ? source.password : "",
      fromEmail,
      fromName: typeof source.fromName === "string" && source.fromName.trim() ? source.fromName.trim() : "United Tigers",
      // Without a separate admin inbox, club notifications go to the sending mailbox.
      adminEmail: adminEmail || fromEmail || (user.includes("@") ? user : ""),
    };
  } catch {
    return null;
  }
}

async function deliver(config: SmtpConfig, to: string, content: MailContent) {
  if (!config.host || !config.password) throw new Error("Add the SMTP host and password first.");
  const fromAddress = config.fromEmail || config.user;
  if (!fromAddress) throw new Error("Add a from email address first.");
  if (!to) throw new Error("No recipient address.");
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    connectionTimeout: 15000,
  });
  await transport.sendMail({
    from: `"${config.fromName.replaceAll('"', "")}" <${fromAddress}>`,
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}

async function readReadySmtp() {
  const config = await readSmtp();
  return config && config.host && config.password ? config : null;
}

async function send(config: SmtpConfig, to: string, content: MailContent, label: string) {
  if (!to) {
    console.error(`${label} mail skipped: no recipient address`);
    return;
  }
  try {
    await deliver(config, to, content);
  } catch (error) {
    console.error(`${label} mail failed`, error instanceof Error ? error.message : "unknown error");
  }
}

export async function notifyAdmin(content: MailContent) {
  const config = await readReadySmtp();
  if (!config) {
    console.warn("Mail skipped: SMTP host and password are not saved in Site settings");
    return;
  }
  await send(config, config.adminEmail, content, "Admin");
}

export async function notifyAdminAndUser(message: { admin: MailContent; userEmail: string; user: MailContent }) {
  const config = await readReadySmtp();
  if (!config) {
    console.warn("Mail skipped: SMTP host and password are not saved in Site settings");
    return;
  }
  await Promise.all([
    send(config, config.adminEmail, message.admin, "Admin"),
    send(config, message.userEmail, message.user, "User"),
  ]);
}

/** Sends a test message with the saved SMTP settings and reports failures instead of swallowing them. */
export async function sendTestMail(to?: string): Promise<{ to: string }> {
  const config = await readSmtp();
  if (!config) throw new Error("Mail settings are not saved yet.");
  const recipient = to?.trim() || config.adminEmail;
  if (!recipient) throw new Error("Enter a test address or save an admin email first.");
  await deliver(config, recipient, await renderEmail({
    subject: "United Tigers test email",
    preheader: "Outgoing mail from the United Tigers website is working.",
    eyebrow: "Admin check",
    title: "Mail is working",
    intro: "This is a test email from the United Tigers admin. If you can read this, the website can send email to fans and to the club.",
    details: [{ label: "Sent through", value: `SMTP (${config.host}:${config.port})` }, { label: "Admin inbox", value: config.adminEmail || "Not set" }],
  }));
  return { to: recipient };
}
