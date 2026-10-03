import { getNewsBySlug } from "@/lib/data";
import { failure, success } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const story = await getNewsBySlug((await params).slug);
  return story ? success(story) : failure("Story not found", 404);
}
