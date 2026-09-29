"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";

import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { firebaseErrorMessage } from "@/lib/firebase/errors";
import { AuthDivider } from "@/modules/auth/components/auth-divider";
import { GoogleSignInButton } from "@/modules/auth/components/google-sign-in-button";
import { useEstablishSession } from "@/modules/auth/hooks/use-establish-session";
import { loginSchema, type LoginValues } from "@/modules/auth/schemas";

export function LoginForm({ next }: { next?: string | null }) {
  const [formError, setFormError] = useState<string | null>(null);
  const establishSession = useEstablishSession();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const auth = await getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const result = await establishSession(credential.user, { next });
      if (!result.ok) setFormError(result.error);
    } catch (error) {
      setFormError(firebaseErrorMessage(error, "We couldn't sign you in. Please try again."));
    }
  }

  return (
    <div className="grid gap-5">
      <GoogleSignInButton next={next} disabled={isSubmitting} />
      <AuthDivider />

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...form.register("email")}
          />
          <FieldError id="email-error">{errors.email?.message}</FieldError>
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...form.register("password")}
          />
          <FieldError id="password-error">{errors.password?.message}</FieldError>
        </Field>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
