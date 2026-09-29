import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthHeader } from "@/modules/auth/components/auth-header";
import { VerifyEmailPanel } from "@/modules/auth/components/verify-email-panel";
import { requireUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage() {
  const user = await requireUser();
  if (user.emailVerifiedAt) redirect("/dashboard");

  return (
    <>
      <AuthHeader
        title="Check your inbox"
        description="Verifying your email keeps your workspace and your team's data safe."
      />
      <VerifyEmailPanel email={user.email} />
    </>
  );
}
