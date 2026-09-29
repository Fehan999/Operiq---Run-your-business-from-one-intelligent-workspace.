import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border bg-card px-6 py-14 text-center sm:px-12">
          <h2
            id="cta-heading"
            className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Open Operiq in the morning and know what needs your attention.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Set up your workspace in a few minutes. Bring your team when you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                Start free
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
