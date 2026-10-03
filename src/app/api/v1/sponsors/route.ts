import { getSponsors } from "@/lib/data";
import { success } from "@/lib/api";

export async function GET() {
  return success(await getSponsors());
}
