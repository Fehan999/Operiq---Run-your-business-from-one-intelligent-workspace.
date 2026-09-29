import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/modules/marketing/components/product-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent)] [background-size:24px_24px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            The AI business command center
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Your business. <span className="text-primary">One intelligent workspace.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-balance text-muted-foreground">
            Manage customers, projects, finance, documents and workflows with AI working across your
            entire business, and acting only when you say so.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">
                Start free
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#product">Take the tour</Link>
            </Button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden />
            Free plan, no credit card. Your data stays in your workspace.
          </p>
        </div>

        <div id="product" className="mt-16 scroll-mt-24">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
