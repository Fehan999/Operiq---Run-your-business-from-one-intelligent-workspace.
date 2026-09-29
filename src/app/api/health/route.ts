import { connection } from "next/server";

import { db } from "@/lib/db";
import { logger } from "@/lib/logging/logger";

/**
 * Liveness and database check for uptime monitors. It reveals nothing beyond "up or not"
 * and the round-trip time to Postgres.
 */
export async function GET() {
  await connection();
  const started = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", database: "ok", latencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("health check failed", { error });
    return Response.json(
      { status: "degraded", database: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
