import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthorCard } from "@/components/shared/author-card";
import { safeRedirectPath } from "@/lib/utils";
import { AuthHeader } from "@/modules/auth/components/auth-header";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Start with Operiq for free. One workspace for customers, projects, finance and an AI agent that works with your approval. Built by Ehan Siddique.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeRedirectPath(params.next) : null;

  const user = await getCurrentUser();
  if (user) redirect(user.emailVerifiedAt ? (next ?? "/dashboard") : "/verify-email");

  return (
    <>
      <AuthHeader
        title="Create your account"
        description="Free to start. Set up your workspace in a couple of minutes."
      />
      <RegisterForm next={next} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
      <AuthorCard className="mt-8" />
    </>
  );
}
