import { z } from "zod";

const kitPhotosSchema = z.array(z.string().trim().min(1).max(1000).regex(/^(https?:\/\/|\/)/)).max(12);

/** Reads kit photo URLs saved on a player (`kitPhotos` JSON column). */
export function readKitPhotos(value: unknown): string[] {
  const parsed = kitPhotosSchema.safeParse(value ?? []);
  if (!parsed.success) return [];
  return [...new Set(parsed.data)];
}
