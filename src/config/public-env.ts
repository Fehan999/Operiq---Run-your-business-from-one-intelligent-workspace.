/*
 * Values that are safe to ship to the browser. Next inlines NEXT_PUBLIC_* at build time,
 * which only works when each variable is referenced literally like below.
 */

interface AppUrlSources {
  explicit?: string;
  vercelEnv?: string;
  vercelUrl?: string;
  vercelProductionUrl?: string;
}

/**
 * The public URL used for invite links, canonical URLs and the sitemap. An explicit
 * NEXT_PUBLIC_APP_URL always wins; on Vercel we fall back to the deployment's own domain,
 * so a first deploy works before the final domain is known.
 */
export function resolveAppUrl(sources: AppUrlSources): string {
  const host =
    sources.vercelEnv === "production"
      ? (sources.vercelProductionUrl ?? sources.vercelUrl)
      : sources.vercelUrl;
  const url = sources.explicit || (host ? `https://${host}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

export const publicEnv = {
  appUrl: resolveAppUrl({
    explicit: process.env.NEXT_PUBLIC_APP_URL,
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
    vercelProductionUrl: process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
  }),
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  },
  authorLinkedinUrl: process.env.NEXT_PUBLIC_AUTHOR_LINKEDIN_URL || undefined,
} as const;

/** The Firebase variables sign-in can't work without that are currently empty. */
export const missingFirebaseVariables = (
  [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", publicEnv.firebase.apiKey],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", publicEnv.firebase.authDomain],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", publicEnv.firebase.projectId],
  ] as const
)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const isFirebaseConfigured = missingFirebaseVariables.length === 0;
