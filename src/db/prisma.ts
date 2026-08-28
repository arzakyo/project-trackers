import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.plfnkywlxfezfmkzkdfl:UZmy8dSBQp5UsqRk@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.globalPrisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.globalPrisma = prisma;
}
