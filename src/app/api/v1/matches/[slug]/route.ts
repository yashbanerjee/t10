import { getMatchBySlug } from "@/lib/data";
import { failure, success } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const match = await getMatchBySlug(slug);
  return match ? success(match) : failure("Match not found", 404);
}

