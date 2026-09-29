import {
  CalendarClock,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

const SAMPLE_ITEMS = [
  {
    icon: UserRoundCheck,
    title: "5 high-value leads need a follow-up",
    detail: "No contact in the last 7 days",
  },
  {
    icon: CircleDollarSign,
    title: "3 invoices are overdue",
    detail: "$4,200 outstanding",
  },
  {
    icon: CalendarClock,
    title: "Website redesign is due Friday",
    detail: "4 tasks still open",
  },
] as const;

/** Right-hand panel on the auth pages: a quiet preview of what Operiq does. */
export function AuthShowcase() {
  return (
    <section
      aria-label="What Operiq does"
      className="relative hidden overflow-hidden border-l bg-sidebar lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] opacity-70"
      />
      <div className="relative mx-auto w-full max-w-md">
        <p className="text-sm font-medium text-primary">Operiq</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
          Run your business from one intelligent workspace.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Customers, projects, invoices and documents in one place, with an AI agent that reads your
          real data and only acts after you approve.
        </p>

        <div className="mt-8 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-primary" aria-hidden />
              What needs attention today
            </div>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
              Example
            </span>
          </div>
          <ul className="mt-3 divide-y">
            {SAMPLE_ITEMS.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex items-start gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden />
          Every workspace is isolated. Every AI action needs your approval.
        </p>
      </div>
    </section>
  );
}
