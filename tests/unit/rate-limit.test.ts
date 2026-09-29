import { afterEach, describe, expect, it, vi } from "vitest";

import { MemoryRateLimitStore, rateLimit, type RateLimitStore } from "@/lib/security/rate-limit";

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks", async () => {
    const store = new MemoryRateLimitStore();
    const rule = { limit: 3, windowMs: 60_000 };

    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit("ip:1", rule, store));

    expect(results.map((result) => result.success)).toEqual([true, true, true, false]);
    expect(results[2]!.remaining).toBe(0);
  });

  it("counts keys separately", async () => {
    const store = new MemoryRateLimitStore();
    const rule = { limit: 1, windowMs: 60_000 };
    expect((await rateLimit("a", rule, store)).success).toBe(true);
    expect((await rateLimit("b", rule, store)).success).toBe(true);
    expect((await rateLimit("a", rule, store)).success).toBe(false);
  });

  it("resets after the window", async () => {
    vi.useFakeTimers();
    const store = new MemoryRateLimitStore();
    const rule = { limit: 1, windowMs: 1_000 };

    expect((await rateLimit("k", rule, store)).success).toBe(true);
    expect((await rateLimit("k", rule, store)).success).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect((await rateLimit("k", rule, store)).success).toBe(true);
  });

  it("fails open when the store is down", async () => {
    const broken: RateLimitStore = { hit: () => Promise.reject(new Error("redis down")) };
    const result = await rateLimit("k", { limit: 1, windowMs: 1_000 }, broken);
    expect(result.success).toBe(true);
  });

  it("keeps memory bounded", async () => {
    const store = new MemoryRateLimitStore(5);
    for (let i = 0; i < 20; i++) await store.hit(`key-${i}`, 60_000);
    // Evicted keys start a fresh window, so they are allowed again.
    expect((await rateLimit("key-0", { limit: 1, windowMs: 60_000 }, store)).success).toBe(true);
  });
});
