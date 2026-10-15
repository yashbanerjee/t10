import { createSign } from "node:crypto";
import { prisma } from "@/lib/db";
import { type FirebaseServiceAccount, getSiteUrl, readFirebaseServiceAccount } from "@/lib/site-settings";

/** Topics every app install subscribes to (see `mobile/lib/services/push.dart`). */
export const PUSH_TOPICS = ["all", "matches", "news"] as const;
export type PushTopic = (typeof PUSH_TOPICS)[number];

/** Must match the Android channel the app creates, or Android files the push under a default channel. */
const ANDROID_CHANNEL = "club_news";

/** The Firebase project the mobile app is built against (`mobile/lib/firebase_options.dart`). */
export const APP_FIREBASE_PROJECT = "united-tigers";

type PushInput = { id: string; title: string; body: string; imageUrl?: string | null; link?: string | null; topic: PushTopic };
export type PushResult = { ok: true; messageId: string } | { ok: false; message: string };

let cachedToken: { value: string; expiresAt: number; email: string } | null = null;

/** The key uploaded in Site settings wins; the FIREBASE_SERVICE_ACCOUNT variable (JSON or base64 JSON) is the fallback. */
async function readServiceAccount(): Promise<{ account: FirebaseServiceAccount; source: "settings" | "environment" } | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "firebase" } }).catch(() => null);
  const fromSettings = readFirebaseServiceAccount(row?.value);
  if (fromSettings) return { account: fromSettings, source: "settings" };
  const fromEnv = readFirebaseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  return fromEnv ? { account: fromEnv, source: "environment" } : null;
}

export async function pushConfigured() {
  return Boolean(await readServiceAccount());
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

async function accessToken(account: FirebaseServiceAccount, fresh = false) {
  if (!fresh && cachedToken && cachedToken.email === account.client_email && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  let signature: Buffer;
  try {
    signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(account.private_key);
  } catch {
    throw new Error("The private key in the service account file is damaged. Download a new key from Firebase");
  }
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
  const saved = await readServiceAccount();
  if (!saved) return { ok: false, message: "Firebase is not connected. Upload the Firebase service account key in Site settings before sending notifications." };
  const { account } = saved;
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

/** Signs in with the saved key and asks FCM to validate a message to the "all" topic, so nothing reaches any phone. */
export async function checkPush(): Promise<{ ok: boolean; message: string; projectId?: string; source?: string }> {
  const saved = await readServiceAccount();
  if (!saved) return { ok: false, message: "No Firebase service account key is saved yet." };
  const { account, source } = saved;
  const from = source === "settings" ? "the uploaded key" : "the FIREBASE_SERVICE_ACCOUNT variable";
  try {
    const token = await accessToken(account, true);
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ validate_only: true, message: { topic: "all", notification: { title: "Connection check", body: "Not delivered" } } }),
    });
    const result = await response.json().catch(() => null) as { error?: { message?: string; status?: string } } | null;
    if (!response.ok) {
      const reason = result?.error?.status === "PERMISSION_DENIED" ? "this key is not allowed to send messages. Give the service account the Firebase Cloud Messaging Admin role, or generate the key from Firebase → Project settings → Service accounts" : result?.error?.message || `Firebase returned ${response.status}`;
      return { ok: false, projectId: account.project_id, source, message: `Firebase signed in with ${from}, but ${reason}.` };
    }
    if (account.project_id !== APP_FIREBASE_PROJECT) return { ok: false, projectId: account.project_id, source, message: `The key works, but it belongs to the Firebase project "${account.project_id}" while the app uses "${APP_FIREBASE_PROJECT}", so phones would not receive these notifications. Upload a key from the ${APP_FIREBASE_PROJECT} project.` };
    return { ok: true, projectId: account.project_id, source, message: `Firebase is connected (project ${account.project_id}, using ${from}). Notifications can be sent.` };
  } catch (error) {
    return { ok: false, projectId: account.project_id, source, message: `Firebase check failed with ${from}: ${error instanceof Error ? error.message : "Firebase could not be reached"}.` };
  }
}
