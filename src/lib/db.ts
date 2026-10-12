import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Railway's TCP proxy drops connections that sit idle, and without timeouts a request on a dropped connection waits
 * forever, so the page keeps loading. Limits set in DATABASE_URL itself win over these.
 */
function withTimeouts(url: string) {
  try {
    const parsed = new URL(url);
    for (const [key, value] of [["connect_timeout", "10"], ["pool_timeout", "15"], ["socket_timeout", "30"]]) if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch { return url; }
}

// Keep the static site/build usable without credentials; database-backed actions still fail closed.
const datasourceUrl = withTimeouts(process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/united_tigers?schema=public");
export const databaseConfigured = Boolean(process.env.DATABASE_URL);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl, log: process.env.NODE_ENV === "development" && databaseConfigured ? ["warn"] : [] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
