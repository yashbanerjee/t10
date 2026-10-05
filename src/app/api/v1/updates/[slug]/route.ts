import { getUpdateBySlug } from "@/lib/data";
import { failure, success } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const update = await getUpdateBySlug(slug);
  return update ? success(update) : failure("Update not found", 404);
}
