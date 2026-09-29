import "server-only";
import { unstable_rethrow } from "next/navigation";

import { toActionFailure, type ActionResult } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { getRequestMetadata } from "@/lib/security/request";

/**
 * Wraps the body of a server action so every action returns the same result shape.
 * Known errors become friendly messages; unknown ones are logged with the request id and
 * reported generically. redirect() and notFound() still work because they are rethrown.
 */
export async function runAction<T>(
  name: string,
  handler: () => Promise<T>,
  options?: { successMessage?: string },
): Promise<ActionResult<T>> {
  try {
    const data = await handler();
    return { ok: true, data, message: options?.successMessage };
  } catch (error) {
    unstable_rethrow(error);
    const failure = toActionFailure(error);
    if (failure.code === "INTERNAL") {
      const { requestId } = await getRequestMetadata();
      logger.error(`action ${name} failed`, { error, requestId });
    }
    return failure;
  }
}
