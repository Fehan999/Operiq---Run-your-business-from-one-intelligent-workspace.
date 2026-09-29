import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import { hasValidBearer } from "@/lib/security/bearer";
import { cleanupExpiredRecords } from "@/modules/maintenance/service";

/**
 * Called once a day by Vercel Cron (see vercel.json). Vercel attaches
 * `Authorization: Bearer $CRON_SECRET`; anything without it is rejected.
 */
export async function GET(request: Request) {
  if (!hasValidBearer(request.headers.get("authorization"), getServerEnv().CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredRecords();
    logger.info("scheduled cleanup finished", result);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    logger.error("scheduled cleanup failed", { error });
    return Response.json({ ok: false }, { status: 500 });
  }
}
