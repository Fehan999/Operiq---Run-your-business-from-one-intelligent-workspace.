import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getServerEnv().DATABASE_URL,
    // Serverless functions scale out to many instances, each with its own pool. Keeping
    // each pool small stays well inside the connection limits of a hosted pooler.
    max: process.env.VERCEL ? 5 : 10,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Reuse one client across hot reloads in development, otherwise every edit opens a new pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * The client is created on first use rather than at import time. Route modules are
 * evaluated during `next build`, and the build should not need a database URL.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type Db = PrismaClient;
export type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
export type DbClient = PrismaClient | TransactionClient;
