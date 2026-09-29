import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env files on its own.
loadEnv({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct connection; poolers like PgBouncer break advisory locks.
    // The URL can be missing during `prisma generate`, which does not touch the database.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
