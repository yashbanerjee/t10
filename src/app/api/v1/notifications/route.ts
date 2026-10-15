import { getSentNotifications } from "@/lib/data";
import { success } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  return success(await getSentNotifications());
}
