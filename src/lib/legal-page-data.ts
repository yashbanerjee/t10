import { prisma } from "@/lib/db";
import { LEGAL_SETTING_KEYS, legalDefaults, readLegalPage, type LegalPageKind } from "@/lib/legal-pages";

export async function getLegalPage(kind: LegalPageKind) {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LEGAL_SETTING_KEYS[kind] } });
    return readLegalPage(kind, row?.value);
  } catch {
    return legalDefaults[kind];
  }
}
