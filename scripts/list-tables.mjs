import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
console.log(tables);
await prisma.$disconnect();
