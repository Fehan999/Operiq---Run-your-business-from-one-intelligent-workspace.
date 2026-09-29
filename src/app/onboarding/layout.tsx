import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { requireVerifiedUser } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Set up your workspace",
  robots: { index: false, follow: false },
};

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVerifiedUser();

  return (
    <div className="flex min-h-dvh flex-col bg-sidebar">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <Link href="/dashboard" aria-label="Operiq" className="rounded-md">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main id="main" className="flex flex-1 justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
