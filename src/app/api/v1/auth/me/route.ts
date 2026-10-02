import { getSession } from "@/lib/auth";
import { failure, success } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  return session ? success(session) : failure("Authentication required", 401);
}

