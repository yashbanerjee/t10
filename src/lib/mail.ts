import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

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
    return {
      host: typeof source.host === "string" ? source.host.trim() : "",
      port: Number.isFinite(port) && port > 0 ? port : 587,
      secure: source.secure === true || port === 465,
      user: typeof source.user === "string" ? source.user.trim() : "",
      password: typeof source.password === "string" ? source.password : "",
      fromEmail: typeof source.fromEmail === "string" ? source.fromEmail.trim() : "",
      fromName: typeof source.fromName === "string" && source.fromName.trim() ? source.fromName.trim() : "United Tigers",
      adminEmail: typeof source.adminEmail === "string" ? source.adminEmail.trim() : "",
    };
  } catch {
    return null;
  }
}

async function deliver(config: SmtpConfig, to: string, subject: string, text: string) {
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
    subject,
    text,
  });
}

async function readReadySmtp() {
  const config = await readSmtp();
  return config && config.host && config.password && config.adminEmail ? config : null;
}

export async function notifyAdmin(subject: string, text: string) {
  const config = await readReadySmtp();
  if (!config) return;
  try {
    await deliver(config, config.adminEmail, subject, text);
  } catch (error) {
    console.error("Admin mail failed", error instanceof Error ? error.message : "unknown error");
  }
}

export async function notifyAdminAndUser(message: { adminSubject: string; adminText: string; userEmail: string; userSubject: string; userText: string }) {
  const config = await readReadySmtp();
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

/** Sends a test message with the saved SMTP settings and reports failures instead of swallowing them. */
export async function sendTestMail(to?: string): Promise<{ to: string }> {
  const config = await readSmtp();
  if (!config) throw new Error("Mail settings are not saved yet.");
  const recipient = to?.trim() || config.adminEmail;
  if (!recipient) throw new Error("Enter a test address or save an admin email first.");
  await deliver(
    config,
    recipient,
    "United Tigers test email",
    `This is a test email from the United Tigers admin.\n\nIt was sent through SMTP (${config.host}:${config.port}). If you can read this, outgoing mail is working.`,
  );
  return { to: recipient };
}
