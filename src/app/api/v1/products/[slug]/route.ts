import { getProductBySlug } from "@/lib/data";
import { failure, success } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  return product ? success(product) : failure("Product not found", 404);
}
