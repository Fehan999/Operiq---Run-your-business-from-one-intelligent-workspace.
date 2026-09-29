import { logger } from "@/lib/logging/logger";

export interface RateLimitRule {
  /** Maximum number of hits allowed inside the window. */
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

/**
 * Fixed-window counter kept in process memory. Good enough for local development and a
 * single instance; serverless deployments should configure Redis so limits are shared.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly maxKeys = 10_000) {}

  async hit(key: string, windowMs: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      if (this.buckets.size >= this.maxKeys) this.evictExpired(now);
      const bucket = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      return bucket;
    }

    existing.count += 1;
    return existing;
  }

  private evictExpired(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    // Still full after cleanup means we are under heavy load; drop the oldest entries.
    if (this.buckets.size >= this.maxKeys) {
      const overflow = this.buckets.size - this.maxKeys + 1;
      let removed = 0;
      for (const key of this.buckets.keys()) {
        this.buckets.delete(key);
        if (++removed >= overflow) break;
      }
    }
  }
}

/** Upstash Redis over its REST API, which works from serverless functions without a TCP pool. */
export class UpstashRateLimitStore implements RateLimitStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async hit(key: string, windowMs: number) {
    const response = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(windowMs), "NX"],
        ["PTTL", key],
      ]),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Upstash responded with ${response.status}`);
    }

    const [incr, , pttl] = (await response.json()) as Array<{ result: number }>;
    const ttl = pttl && pttl.result > 0 ? pttl.result : windowMs;
    return { count: incr?.result ?? 1, resetAt: Date.now() + ttl };
  }
}

let defaultStore: RateLimitStore | undefined;

function getDefaultStore(): RateLimitStore {
  if (defaultStore) return defaultStore;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  defaultStore = url && token ? new UpstashRateLimitStore(url, token) : new MemoryRateLimitStore();
  return defaultStore;
}

export async function rateLimit(
  key: string,
  rule: RateLimitRule,
  store: RateLimitStore = getDefaultStore(),
): Promise<RateLimitResult> {
  try {
    const { count, resetAt } = await store.hit(`ratelimit:${key}`, rule.windowMs);
    return { success: count <= rule.limit, remaining: Math.max(0, rule.limit - count), resetAt };
  } catch (error) {
    // Failing open keeps sign-in working if Redis has an outage. The event is logged so
    // it shows up in monitoring.
    logger.warn("rate limiter unavailable, allowing request", { key, error });
    return { success: true, remaining: rule.limit, resetAt: Date.now() + rule.windowMs };
  }
}

export const RATE_LIMITS = {
  signIn: { limit: 10, windowMs: 60_000 },
  invite: { limit: 30, windowMs: 60 * 60_000 },
  upload: { limit: 20, windowMs: 10 * 60_000 },
  sensitive: { limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;
