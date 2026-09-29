"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { toast } from "sonner";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOutAction } from "@/modules/auth/actions";

export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = useCallback(async () => {
    setPending(true);
    const result = await signOutAction();
    if (!result.ok) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    // Clear the tab's Firebase state too; failures here do not matter because the
    // server session is already gone.
    await getFirebaseAuth()
      .then((auth) => signOut(auth))
      .catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }, [router]);

  return { signOut: run, pending };
}
