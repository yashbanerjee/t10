import { prisma } from "@/lib/db";

export type ClubOwner = { id: string; name: string; slug: string; title: string; headline: string | null; summary: string | null; bio: string | null; quote: string | null; image: string | null; facebook: string | null; instagram: string | null };

/** Owners switched on in admin, in their display order, for the Meet the owners page. */
export async function getOwners(): Promise<ClubOwner[]> {
  try {
    return await prisma.owner.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true, title: true, headline: true, summary: true, bio: true, quote: true, image: true, facebook: true, instagram: true } });
  } catch {
    return [];
  }
}
