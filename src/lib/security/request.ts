import "server-only";
import { headers } from "next/headers";

export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
}

const EMPTY: RequestMetadata = { ipAddress: null, userAgent: null, requestId: null };

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first ? first.slice(0, 64) : null;
}

/**
 * Reads client metadata for audit logs and rate limiting. Returns empty values outside of
 * a request (scripts, tests) instead of throwing.
 */
export async function getRequestMetadata(): Promise<RequestMetadata> {
  try {
    const h = await headers();
    return {
      ipAddress: firstForwardedIp(h.get("x-forwarded-for")) ?? h.get("x-real-ip"),
      userAgent: h.get("user-agent")?.slice(0, 512) ?? null,
      requestId: h.get("x-request-id"),
    };
  } catch {
    return EMPTY;
  }
}
