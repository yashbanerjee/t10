import { prisma } from "@/lib/db";

export type CheckoutCountry = { id: string; name: string; isoCode: string | null; dialCode: string };

/** Countries switched on in admin, in their display order, for the checkout dropdowns. */
export async function getCountries(): Promise<CheckoutCountry[]> {
  try {
    return await prisma.country.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, isoCode: true, dialCode: true } });
  } catch {
    return [];
  }
}
