import { getContestBySlug } from "@/lib/data";
import { failure, success } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const contest = await getContestBySlug((await params).slug);
  return contest ? success(contest) : failure("Contest not found", 404);
}
