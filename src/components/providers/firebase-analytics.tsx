"use client";

import { useEffect } from "react";

import { isFirebaseConfigured, publicEnv } from "@/config/public-env";

/**
 * Loads Google Analytics through Firebase on public marketing pages only. The SDK is
 * imported lazily after hydration so it never blocks rendering, and it is skipped in
 * development and in browsers where analytics is unsupported (for example with cookies off).
 */
export function FirebaseAnalytics() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!isFirebaseConfigured || !publicEnv.firebase.measurementId) return;

    let cancelled = false;
    void (async () => {
      const [{ getFirebaseApp }, { getAnalytics, isSupported }] = await Promise.all([
        import("@/lib/firebase/client"),
        import("firebase/analytics"),
      ]);
      if (cancelled || !(await isSupported())) return;
      getAnalytics(getFirebaseApp());
    })().catch(() => {
      // Analytics is optional; ad blockers commonly block it and that is fine.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
