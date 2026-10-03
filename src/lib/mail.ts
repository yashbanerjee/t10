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
    const host = typeof source.host === "string" ? source.host.trim() : "";
    const adminEmail = typeof source.adminEmail === "string" ? source.adminEmail.trim() : "";
    const password = typeof source.password === "string" ? source.password : "";
    if (!host || !adminEmail || !password) return null;
    const port = Number(source.port);
    return {
      host,
      port: Number.isFinite(port) ? port : 587,
      secure: source.secure === true || port === 465,
      user: typeof source.user === "string" ? source.user.trim() : "",
      password,
      fromEmail: typeof source.fromEmail === "string" ? source.fromEmail.trim() : "",
      fromName: typeof source.fromName === "string" && source.fromName.trim() ? source.fromName.trim() : "United Tigers",
      adminEmail,
    };
  } catch {
    return null;
  }
}

async function deliver(config: SmtpConfig, to: string, subject: string, text: string) {
  const fromAddress = config.fromEmail || config.user;
  if (!fromAddress || !to) return;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  });
  await transport.sendMail({
    from: `"${config.fromName.replaceAll('"', "")}" <${fromAddress}>`,
    to,
    subject,
    text,
  });
}

export async function notifyAdmin(subject: string, text: string) {
  const config = await readSmtp();
  if (!config) return;
  try {
    await deliver(config, config.adminEmail, subject, text);
  } catch (error) {
    console.error("Admin mail failed", error instanceof Error ? error.message : "unknown error");
  }
}

export async function notifyAdminAndUser(message: { adminSubject: string; adminText: string; userEmail: string; userSubject: string; userText: string }) {
  const config = await readSmtp();
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
