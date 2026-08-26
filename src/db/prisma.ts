import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/trackers_db";

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

const adapter = new PrismaPg(pool);

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.globalPrisma || new PrismaClient({ adapter } as any);

if (process.env.NODE_ENV !== "production") {
  globalThis.globalPrisma = prisma;
}
