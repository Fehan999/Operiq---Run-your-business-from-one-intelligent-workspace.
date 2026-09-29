import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
      <Link href="/" aria-label="Operiq home" className="rounded-md">
        <Logo />
      </Link>
      <main id="main" className="grid gap-3">
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="max-w-sm text-muted-foreground">
          The link may be broken, or the page may belong to a workspace you&apos;re not part of.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
