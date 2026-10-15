import { createSign } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-settings";

/** Topics every app install subscribes to (see `mobile/lib/services/push.dart`). */
export const PUSH_TOPICS = ["all", "matches", "news"] as const;
export type PushTopic = (typeof PUSH_TOPICS)[number];

/** Must match the Android channel the app creates, or Android files the push under a default channel. */
const ANDROID_CHANNEL = "club_news";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };
type PushInput = { id: string; title: string; body: string; imageUrl?: string | null; link?: string | null; topic: PushTopic };
export type PushResult = { ok: true; messageId: string } | { ok: false; message: string };

let cachedToken: { value: string; expiresAt: number; email: string } | null = null;

function parseAccount(raw: unknown): ServiceAccount | null {
  let value = raw;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    try {
      value = JSON.parse(text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (row.serviceAccount) return parseAccount(row.serviceAccount);
  const { project_id, client_email, private_key } = row;
  if (typeof project_id !== "string" || typeof client_email !== "string" || typeof private_key !== "string") return null;
  return { project_id, client_email, private_key: private_key.replace(/\\n/g, "\n") };
}

/** The Firebase service account comes from the FIREBASE_SERVICE_ACCOUNT variable (JSON or base64 JSON), or the private `firebase` site setting. */
async function readServiceAccount() {
  const fromEnv = parseAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (fromEnv) return fromEnv;
  const row = await prisma.siteSetting.findUnique({ where: { key: "firebase" } }).catch(() => null);
  return parseAccount(row?.value);
}

export async function pushConfigured() {
  return Boolean(await readServiceAccount());
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

async function accessToken(account: ServiceAccount) {
  if (cachedToken && cachedToken.email === account.client_email && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(account.private_key);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${base64url(signature)}` }),
  });
  const result = await response.json().catch(() => null) as { access_token?: string; expires_in?: number; error_description?: string } | null;
  if (!response.ok || !result?.access_token) throw new Error(result?.error_description || "Firebase rejected the service account");
  cachedToken = { value: result.access_token, expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000, email: account.client_email };
  return cachedToken.value;
}

/** Sends one notification to every app install on the topic through the FCM HTTP v1 API. */
export async function sendPush(input: PushInput): Promise<PushResult> {
  const account = await readServiceAccount();
  if (!account) return { ok: false, message: "Firebase is not connected. Add the Firebase service account key before sending notifications." };
  const siteUrl = await getSiteUrl();
  const image = input.imageUrl ? (input.imageUrl.startsWith("/") ? `${siteUrl}${input.imageUrl}` : input.imageUrl) : undefined;
  const data: Record<string, string> = { notificationId: input.id };
  if (input.link) data.link = input.link;
  if (image) data.image = image;
  const message = {
    topic: input.topic,
    notification: { title: input.title, body: input.body, ...(image ? { image } : {}) },
    data,
    android: { priority: "HIGH", notification: { channel_id: ANDROID_CHANNEL, icon: "ic_notification", color: "#C9177E", ...(image ? { image } : {}) } },
    apns: { headers: { "apns-priority": "10" }, payload: { aps: { sound: "default", "mutable-content": 1 } }, ...(image ? { fcm_options: { image } } : {}) },
  };
  try {
    const token = await accessToken(account);
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const result = await response.json().catch(() => null) as { name?: string; error?: { message?: string } } | null;
    if (!response.ok || !result?.name) return { ok: false, message: result?.error?.message || `Firebase returned ${response.status}` };
    return { ok: true, messageId: result.name };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Firebase could not be reached" };
  }
}
