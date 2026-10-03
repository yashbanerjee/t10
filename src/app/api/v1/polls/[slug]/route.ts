import { getPollBySlug } from "@/lib/data";
import { failure, success } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const poll = await getPollBySlug((await params).slug);
  return poll ? success(poll) : failure("Poll not found", 404);
}
