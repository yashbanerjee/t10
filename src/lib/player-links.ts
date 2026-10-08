import { z } from "zod";

/** Links saved on a player under the `socialLinks` JSON column. */
export type PlayerLinks = { profile?: string | null };

const link = z.union([z.null(), z.literal(""), z.string().trim().url().max(500).regex(/^https?:\/\//, "Links start with http:// or https://")]).optional();

export const playerLinksSchema = z.object({ profile: link });

/** Form field key → stored link key. */
export const linkFormKeys = { profileUrl: "profile" } as const;

/** Pulls the link fields out of a form body and returns the cleaned record (null when every link is blank). */
export function linksFromForm(body: Record<string, unknown>): { ok: true; touched: boolean; value: PlayerLinks | null } | { ok: false; message: string } {
  const record: Record<string, unknown> = {};
  let touched = false;
  for (const [formKey, linkKey] of Object.entries(linkFormKeys)) {
    if (formKey in body) { record[linkKey] = body[formKey]; touched = true; }
    delete body[formKey];
  }
  const parsed = playerLinksSchema.safeParse(record);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Profile link is invalid." };
  const entries = Object.entries(parsed.data).filter(([, item]) => typeof item === "string" && item !== "");
  return { ok: true, touched, value: entries.length ? (Object.fromEntries(entries) as PlayerLinks) : null };
}

export function readLinks(value: unknown): PlayerLinks | null {
  const parsed = playerLinksSchema.safeParse(value ?? {});
  if (!parsed.success) return null;
  const entries = Object.entries(parsed.data).filter(([, item]) => typeof item === "string" && item !== "");
  return entries.length ? (Object.fromEntries(entries) as PlayerLinks) : null;
}

export function flattenLinks(value: unknown) {
  const links = readLinks(value);
  const values: Record<string, string> = {};
  for (const [formKey, linkKey] of Object.entries(linkFormKeys)) values[formKey] = links?.[linkKey as keyof PlayerLinks] ?? "";
  return values;
}
