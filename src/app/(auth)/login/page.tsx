import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthorCard } from "@/components/shared/author-card";
import { safeRedirectPath } from "@/lib/utils";
import { AuthHeader } from "@/modules/auth/components/auth-header";
import { LoginForm } from "@/modules/auth/components/login-form";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Operiq, the AI business workspace for CRM, projects, invoices and documents. Built by Ehan Siddique.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeRedirectPath(params.next) : null;

  const user = await getCurrentUser();
  if (user) redirect(user.emailVerifiedAt ? (next ?? "/dashboard") : "/verify-email");

  return (
    <>
      <AuthHeader title="Welcome back" description="Sign in to your Operiq workspace." />
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Operiq?{" "}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
      <AuthorCard className="mt-8" />
    </>
  );
}
