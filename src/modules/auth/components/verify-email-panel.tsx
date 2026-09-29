"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, reload, sendEmailVerification, type User } from "firebase/auth";
import { MailOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { firebaseErrorMessage } from "@/lib/firebase/errors";
import { useEstablishSession } from "@/modules/auth/hooks/use-establish-session";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailPanel({ email }: { email: string }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const establishSession = useEstablishSession();
  const { signOut, pending: signingOut } = useSignOut();
  const completed = useRef(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void getFirebaseAuth().then((auth) => {
      unsubscribe = onAuthStateChanged(auth, (user) => setFirebaseUser(user));
    });
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const checkVerification = useCallback(
    async (manual: boolean) => {
      if (!firebaseUser || completed.current) return;
      if (manual) setChecking(true);
      try {
        await reload(firebaseUser);
        if (firebaseUser.emailVerified) {
          completed.current = true;
          const result = await establishSession(firebaseUser, { forceRefresh: true });
          if (!result.ok) {
            completed.current = false;
            toast.error(result.error);
          }
        } else if (manual) {
          toast.info("Your email isn't verified yet. Open the link we sent, then try again.");
        }
      } catch (error) {
        if (manual) toast.error(firebaseErrorMessage(error));
      } finally {
        if (manual) setChecking(false);
      }
    },
    [firebaseUser, establishSession],
  );

  // Quietly check in the background while the tab is visible, so the page moves on by
  // itself once the link in the email has been clicked.
  useEffect(() => {
    if (!firebaseUser) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) return clearInterval(interval);
      if (document.visibilityState === "visible") void checkVerification(false);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [firebaseUser, checkVerification]);

  async function resend() {
    if (!firebaseUser) return;
    setResending(true);
    try {
      await sendEmailVerification(firebaseUser, { url: `${window.location.origin}/verify-email` });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("Verification email sent.");
    } catch (error) {
      toast.error(firebaseErrorMessage(error, "We couldn't send the email. Please try again."));
    } finally {
      setResending(false);
    }
  }

  const sessionMissing = firebaseUser === null;

  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <MailOpen className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Open it on this device and
          this page will continue automatically.
        </p>
      </div>

      {sessionMissing ? (
        <p className="text-sm text-muted-foreground">
          To resend the email or finish verification here, sign out and sign in again with {email}.
        </p>
      ) : null}

      <div className="grid gap-2">
        <Button onClick={() => checkVerification(true)} loading={checking} disabled={!firebaseUser}>
          I&apos;ve verified my email
        </Button>
        <Button
          variant="outline"
          onClick={resend}
          loading={resending}
          disabled={!firebaseUser || cooldown > 0}
        >
          {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend verification email"}
        </Button>
        <Button variant="ghost" onClick={signOut} loading={signingOut}>
          Use a different account
        </Button>
      </div>
    </div>
  );
}
