import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Keep the static site/build usable without credentials; database-backed actions still fail closed.
const datasourceUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/united_tigers?schema=public";
export const databaseConfigured = Boolean(process.env.DATABASE_URL);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl, log: process.env.NODE_ENV === "development" && databaseConfigured ? ["warn"] : [] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

