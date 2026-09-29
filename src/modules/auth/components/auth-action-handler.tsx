"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { CircleCheck, CircleAlert } from "lucide-react";

import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { firebaseErrorMessage } from "@/lib/firebase/errors";
import { resetPasswordSchema, type ResetPasswordValues } from "@/modules/auth/schemas";

/*
 * Handles the links Firebase puts in its emails (password reset and email verification)
 * when the Firebase console "action URL" points at /auth/action on this site.
 */

type Mode = "resetPassword" | "verifyEmail";

function StatusMessage({
  tone,
  title,
  children,
}: {
  tone: "success" | "error";
  title: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div className="grid gap-4 text-center">
      <Icon
        className={
          tone === "success" ? "mx-auto size-10 text-success" : "mx-auto size-10 text-destructive"
        }
        aria-hidden
      />
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function VerifyEmailAction({ code }: { code: string }) {
  const [state, setState] = useState<{ status: "pending" | "done" | "error"; message?: string }>({
    status: "pending",
  });

  useEffect(() => {
    let active = true;
    getFirebaseAuth()
      .then((auth) => applyActionCode(auth, code))
      .then(() => active && setState({ status: "done" }))
      .catch(
        (error) => active && setState({ status: "error", message: firebaseErrorMessage(error) }),
      );
    return () => {
      active = false;
    };
  }, [code]);

  if (state.status === "pending") return <Skeleton className="h-24 w-full" />;
  if (state.status === "error") {
    return (
      <StatusMessage tone="error" title="We couldn't verify your email">
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Button asChild variant="outline">
          <Link href="/verify-email">Request a new link</Link>
        </Button>
      </StatusMessage>
    );
  }
  return (
    <StatusMessage tone="success" title="Your email is verified">
      <p className="text-sm text-muted-foreground">
        Go back to the tab where you signed up, or continue here.
      </p>
      <Button asChild>
        <Link href="/verify-email">Continue</Link>
      </Button>
    </StatusMessage>
  );
}

function ResetPasswordAction({ code }: { code: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    let active = true;
    getFirebaseAuth()
      .then((auth) => verifyPasswordResetCode(auth, code))
      .then((value) => active && setEmail(value))
      .catch((error) => active && setCodeError(firebaseErrorMessage(error)));
    return () => {
      active = false;
    };
  }, [code]);

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    try {
      const auth = await getFirebaseAuth();
      await confirmPasswordReset(auth, code, values.password);
      setDone(true);
    } catch (error) {
      setFormError(firebaseErrorMessage(error, "We couldn't update your password."));
    }
  }

  if (codeError) {
    return (
      <StatusMessage tone="error" title="This reset link doesn't work">
        <p className="text-sm text-muted-foreground">{codeError}</p>
        <Button asChild variant="outline">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </StatusMessage>
    );
  }
  if (done) {
    return (
      <StatusMessage tone="success" title="Password updated">
        <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </StatusMessage>
    );
  }
  if (!email) return <Skeleton className="h-40 w-full" />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Choose a new password for <span className="font-medium text-foreground">{email}</span>.
      </p>
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <Field>
        <FieldLabel htmlFor="password">New password</FieldLabel>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...form.register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...form.register("confirmPassword")}
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </Field>
      <Button type="submit" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}

export function AuthActionHandler({ mode, code }: { mode: string | null; code: string | null }) {
  if (!code || (mode !== "resetPassword" && mode !== "verifyEmail")) {
    return (
      <StatusMessage tone="error" title="This link is incomplete">
        <p className="text-sm text-muted-foreground">
          Open the link from your email again, or request a new one.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </StatusMessage>
    );
  }

  return (mode as Mode) === "verifyEmail" ? (
    <VerifyEmailAction code={code} />
  ) : (
    <ResetPasswordAction code={code} />
  );
}
