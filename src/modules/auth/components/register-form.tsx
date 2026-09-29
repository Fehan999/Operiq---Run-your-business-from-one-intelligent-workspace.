"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { firebaseErrorMessage } from "@/lib/firebase/errors";
import { AuthDivider } from "@/modules/auth/components/auth-divider";
import { GoogleSignInButton } from "@/modules/auth/components/google-sign-in-button";
import { PasswordStrength } from "@/modules/auth/components/password-strength";
import { useEstablishSession } from "@/modules/auth/hooks/use-establish-session";
import { registerSchema, type RegisterValues } from "@/modules/auth/schemas";

export function RegisterForm({ next }: { next?: string | null }) {
  const [formError, setFormError] = useState<string | null>(null);
  const establishSession = useEstablishSession();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      const auth = await getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(credential.user, { displayName: values.name });

      // The link in the email brings the person back to the verification screen.
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/verify-email`,
      }).catch(() => {
        // Not fatal: the verification screen has a resend button.
      });

      // Force a token refresh so the new display name is part of the claims.
      const result = await establishSession(credential.user, { next, forceRefresh: true });
      if (!result.ok) setFormError(result.error);
    } catch (error) {
      setFormError(
        firebaseErrorMessage(error, "We couldn't create your account. Please try again."),
      );
    }
  }

  return (
    <div className="grid gap-5">
      <GoogleSignInButton next={next} label="Sign up with Google" disabled={isSubmitting} />
      <AuthDivider label="or sign up with email" />

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Cooper"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...form.register("name")}
          />
          <FieldError id="name-error">{errors.name?.message}</FieldError>
        </Field>

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
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-hint"
            {...form.register("password")}
          />
          <PasswordStrength password={password} />
          {errors.password ? (
            <FieldError id="password-hint">{errors.password.message}</FieldError>
          ) : (
            <FieldDescription id="password-hint">
              At least 8 characters with a letter and a number.
            </FieldDescription>
          )}
        </Field>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to use Operiq responsibly.{" "}
          <Link href="/#security" className="underline underline-offset-4 hover:text-foreground">
            How we protect your data
          </Link>
        </p>
      </form>
    </div>
  );
}
