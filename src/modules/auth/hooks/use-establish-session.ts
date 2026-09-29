"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

import { establishSessionAction } from "@/modules/auth/actions";

/**
 * Exchanges the Firebase user for an Operiq session and moves on. The ID token is only
 * sent once, to the server action, and never stored in the browser by our code.
 */
export function useEstablishSession() {
  const router = useRouter();

  return useCallback(
    async (user: User, options: { next?: string | null; forceRefresh?: boolean } = {}) => {
      const idToken = await user.getIdToken(options.forceRefresh ?? false);
      const result = await establishSessionAction({ idToken, next: options.next ?? undefined });
      if (!result.ok) return result;

      router.replace(result.data.redirectTo);
      router.refresh();
      return result;
    },
    [router],
  );
}
