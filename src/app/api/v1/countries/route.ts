import { success } from "@/lib/api";
import { getCountries } from "@/lib/countries";

export const dynamic = "force-dynamic";

export async function GET() {
  return success(await getCountries());
}
