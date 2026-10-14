import { success } from "@/lib/api";
import { getOwners } from "@/lib/owners";

export const dynamic = "force-dynamic";

export async function GET() {
  return success(await getOwners());
}
