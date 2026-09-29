/*
 * Values that are safe to ship to the browser. Next inlines NEXT_PUBLIC_* at build time,
 * which only works when each variable is referenced literally like below.
 */
export const publicEnv = {
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
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

export const isFirebaseConfigured = Boolean(
  publicEnv.firebase.apiKey && publicEnv.firebase.authDomain && publicEnv.firebase.projectId,
);
