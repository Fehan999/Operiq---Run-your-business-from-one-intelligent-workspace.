"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";

import { GoogleIcon } from "@/components/shared/brand-icons";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { firebaseErrorMessage, isPopupDismissed } from "@/lib/firebase/errors";
import { useEstablishSession } from "@/modules/auth/hooks/use-establish-session";

export function GoogleSignInButton({
  next,
  label = "Continue with Google",
  disabled,
}: {
  next?: string | null;
  label?: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const establishSession = useEstablishSession();

  async function handleClick() {
    setPending(true);
    try {
      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);

      const result = await establishSession(credential.user, { next });
      if (!result.ok) {
        toast.error(result.error);
        setPending(false);
      }
    } catch (error) {
      if (!isPopupDismissed(error)) {
        toast.error(firebaseErrorMessage(error, "Google sign-in failed. Please try again."));
      }
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
      loading={pending}
      disabled={disabled}
    >
      {pending ? null : <GoogleIcon className="size-4" />}
      {label}
    </Button>
  );
}
