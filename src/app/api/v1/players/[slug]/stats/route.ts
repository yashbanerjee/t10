import { getPlayerBySlug } from "@/lib/data";
import { getPlayerStats } from "@/lib/stats";
import { failure, success } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPlayerBySlug(slug);
  if (!player) return failure("Player not found", 404);
  return success(await getPlayerStats(player.id));
}
