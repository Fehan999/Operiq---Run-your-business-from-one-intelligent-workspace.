import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/plans";
import type { Plan } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/modules/marketing/components/section-heading";

const HIGHLIGHTS: Record<Plan, string[]> = {
  FREE: [
    "Up to 3 team members",
    "100 customers",
    "AI assistant with 50 requests a month",
    "Audit log",
  ],
  PRO: [
    "Up to 15 team members",
    "10,000 customers",
    "Document AI with cited answers",
    "Automations and advanced analytics",
    "Integrations",
  ],
  BUSINESS: [
    "Up to 100 team members",
    "Higher AI and storage limits",
    "Everything in Pro",
    "Priority support",
  ],
};

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="scroll-mt-20 border-b bg-sidebar py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="pricing-heading"
          eyebrow="Pricing"
          title="Start free. Upgrade when the team grows."
          description="Every plan includes tenant isolation, role-based access and the audit log."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {(Object.keys(PLANS) as Plan[]).map((key) => {
            const plan = PLANS[key];
            const featured = key === "PRO";
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-6",
                  featured && "border-primary shadow-lg shadow-primary/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {featured ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-6 text-4xl font-semibold tracking-tight">
                  ${plan.priceMonthly}
                  <span className="text-sm font-normal text-muted-foreground"> / month</span>
                </p>
                <ul className="mt-6 grid flex-1 content-start gap-2 text-sm">
                  {HIGHLIGHTS[key].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8" variant={featured ? "default" : "outline"}>
                  <Link href="/register">
                    {key === "FREE" ? "Start free" : `Start with ${plan.name}`}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
