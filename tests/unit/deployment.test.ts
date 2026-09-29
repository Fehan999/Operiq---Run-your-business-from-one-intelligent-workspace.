import { describe, expect, it } from "vitest";

import { resolveAppUrl } from "@/config/public-env";
import { hasValidBearer } from "@/lib/security/bearer";

describe("resolveAppUrl", () => {
  it("prefers the explicit URL and trims trailing slashes", () => {
    expect(resolveAppUrl({ explicit: "https://operiq.app/", vercelUrl: "x.vercel.app" })).toBe(
      "https://operiq.app",
    );
  });

  it("uses the stable production domain on Vercel production deploys", () => {
    expect(
      resolveAppUrl({
        vercelEnv: "production",
        vercelUrl: "operiq-abc123.vercel.app",
        vercelProductionUrl: "operiq.vercel.app",
      }),
    ).toBe("https://operiq.vercel.app");
  });

  it("uses the deployment's own domain on previews", () => {
    expect(
      resolveAppUrl({
        vercelEnv: "preview",
        vercelUrl: "operiq-git-feature.vercel.app",
        vercelProductionUrl: "operiq.vercel.app",
      }),
    ).toBe("https://operiq-git-feature.vercel.app");
  });

  it("falls back to localhost for local development", () => {
    expect(resolveAppUrl({})).toBe("http://localhost:3000");
  });
});

describe("hasValidBearer", () => {
  const secret = "a-long-random-cron-secret";

  it("accepts the exact secret", () => {
    expect(hasValidBearer(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects wrong, missing or malformed headers", () => {
    expect(hasValidBearer(`Bearer ${secret}x`, secret)).toBe(false);
    expect(hasValidBearer(secret, secret)).toBe(false);
    expect(hasValidBearer(null, secret)).toBe(false);
    expect(hasValidBearer("Bearer ", secret)).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    expect(hasValidBearer("Bearer anything", undefined)).toBe(false);
    expect(hasValidBearer("Bearer ", "")).toBe(false);
  });
});
