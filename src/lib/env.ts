import "server-only";
import { z } from "zod";

// Empty strings in .env files ("RESEND_API_KEY=") should behave like unset variables.
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),
  SUPABASE_SECRET_KEY: optionalString,
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("Operiq"),
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().min(1).default("Operiq <onboarding@resend.dev>"),
  UPSTASH_REDIS_REST_URL: optionalString,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Parsed lazily so that `next build` and `prisma generate` do not need production
 * secrets. The first request that actually needs a value fails loudly instead.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `- ${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`Invalid server environment:\n${issues.join("\n")}`);
  }

  cached = parsed.data;
  return cached;
}

export const isProduction = process.env.NODE_ENV === "production";
