import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  resendKey: string;
  fromEmail: string;
  fromName: string;
  adminEmail: string;
};

export type MailProvider = "resend" | "smtp";

async function readMailConfig(): Promise<MailConfig | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "smtp" } });
    const value = row?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const port = Number(source.port);
    return {
      host: typeof source.host === "string" ? source.host.trim() : "",
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure: source.secure === true || port === 465,
      user: typeof source.user === "string" ? source.user.trim() : "",
      password: typeof source.password === "string" ? source.password : "",
      resendKey: typeof source.resendKey === "string" ? source.resendKey.trim() : "",
      fromEmail: typeof source.fromEmail === "string" ? source.fromEmail.trim() : "",
      fromName: typeof source.fromName === "string" && source.fromName.trim() ? source.fromName.trim() : "United Tigers",
      adminEmail: typeof source.adminEmail === "string" ? source.adminEmail.trim() : "",
    };
  } catch {
    return null;
  }
}

/** Resend wins whenever a key is saved; otherwise SMTP is used if it is fully configured. */
function providerFor(config: MailConfig): MailProvider | null {
  if (config.resendKey) return "resend";
  if (config.host && config.password) return "smtp";
  return null;
}

async function sendWithResend(config: MailConfig, from: string, to: string, subject: string, text: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${config.resendKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(result?.message || `Resend returned status ${response.status}`);
  }
}

async function sendWithSmtp(config: MailConfig, from: string, to: string, subject: string, text: string) {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    connectionTimeout: 15000,
  });
  await transport.sendMail({ from, to, subject, text });
}

async function deliver(config: MailConfig, to: string, subject: string, text: string): Promise<MailProvider> {
  const provider = providerFor(config);
  if (!provider) throw new Error("Add a Resend API key or SMTP host and password first.");
  const fromAddress = config.fromEmail || config.user;
  if (!fromAddress) throw new Error("Add a from email address first.");
  if (!to) throw new Error("No recipient address.");
  const from = `"${config.fromName.replaceAll('"', "")}" <${fromAddress}>`;
  if (provider === "resend") await sendWithResend(config, from, to, subject, text);
  else await sendWithSmtp(config, from, to, subject, text);
  return provider;
}

async function readReadyConfig() {
  const config = await readMailConfig();
  return config && config.adminEmail && providerFor(config) ? config : null;
}

export async function notifyAdmin(subject: string, text: string) {
  const config = await readReadyConfig();
  if (!config) return;
  try {
    await deliver(config, config.adminEmail, subject, text);
  } catch (error) {
    console.error("Admin mail failed", error instanceof Error ? error.message : "unknown error");
  }
}

export async function notifyAdminAndUser(message: { adminSubject: string; adminText: string; userEmail: string; userSubject: string; userText: string }) {
  const config = await readReadyConfig();
  if (!config) return;
  try {
    await deliver(config, config.adminEmail, message.adminSubject, message.adminText);
  } catch (error) {
    console.error("Admin mail failed", error instanceof Error ? error.message : "unknown error");
  }
  try {
    await deliver(config, message.userEmail, message.userSubject, message.userText);
  } catch (error) {
    console.error("User mail failed", error instanceof Error ? error.message : "unknown error");
  }
}

/** Sends a test message with the saved settings and reports failures instead of swallowing them. */
export async function sendTestMail(to?: string): Promise<{ provider: MailProvider; to: string }> {
  const config = await readMailConfig();
  if (!config) throw new Error("Mail settings are not saved yet.");
  const recipient = to?.trim() || config.adminEmail;
  if (!recipient) throw new Error("Enter a test address or save an admin email first.");
  const provider = await deliver(
    config,
    recipient,
    "United Tigers test email",
    `This is a test email from the United Tigers admin.\n\nIt was sent through ${providerFor(config) === "resend" ? "Resend" : `SMTP (${config.host}:${config.port})`}. If you can read this, outgoing mail is working.`,
  );
  return { provider, to: recipient };
}
