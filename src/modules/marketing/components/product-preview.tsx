import {
  CircleDollarSign,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Sparkles,
  SquareKanban,
  Users,
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Customers" },
  { icon: SquareKanban, label: "Pipeline" },
  { icon: ListChecks, label: "Tasks" },
  { icon: Receipt, label: "Invoices" },
  { icon: Sparkles, label: "Assistant" },
];

const STATS = [
  { label: "Revenue this month", value: "$48,250", delta: "+12%" },
  { label: "Outstanding", value: "$9,420", delta: "3 overdue" },
  { label: "Pipeline value", value: "$126,000", delta: "18 deals" },
];

const BARS = [38, 52, 44, 61, 57, 72, 66, 80, 74, 88, 83, 95];

/**
 * A drawn preview of the product for the landing page. It is built from markup rather
 * than a screenshot so it stays sharp, themes with the site and costs no image bytes.
 * The numbers are illustrative and labelled as such.
 */
export function ProductPreview() {
  return (
    <figure className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-xl border bg-card shadow-xl shadow-black/5 dark:shadow-black/40">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>
        <div className="grid md:grid-cols-[200px_1fr]" aria-hidden>
          <div className="hidden border-r bg-sidebar p-3 md:block">
            <div className="mb-4 flex items-center gap-2 px-2 py-1.5">
              <span className="size-6 rounded-md bg-primary/15" />
              <span className="h-2.5 w-24 rounded bg-foreground/15" />
            </div>
            <ul className="grid gap-0.5">
              {NAV.map(({ icon: Icon, label, active }) => (
                <li
                  key={label}
                  className={
                    active
                      ? "flex items-center gap-2 rounded-md bg-sidebar-accent px-2 py-1.5 text-xs font-medium"
                      : "flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"
                  }
                >
                  <Icon className={active ? "size-3.5 text-primary" : "size-3.5"} />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg border p-3 text-left">
                  <p className="text-[0.6875rem] text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{stat.value}</p>
                  <p className="text-[0.6875rem] text-primary">{stat.delta}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium">Revenue</p>
                <div className="mt-3 flex h-32 items-end gap-1.5">
                  {BARS.map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t bg-primary/70 dark:bg-primary/60"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-3 text-left">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Sparkles className="size-3.5 text-primary" /> Assistant
                </p>
                <p className="mt-2 rounded-md bg-muted px-2.5 py-2 text-xs">
                  Which leads haven&apos;t been contacted in 7 days?
                </p>
                <div className="mt-2 rounded-md border px-2.5 py-2 text-xs">
                  <p className="text-muted-foreground">Found 5 leads worth $38,400.</p>
                  <div className="mt-2 flex items-center justify-between rounded border border-primary/40 bg-primary/5 px-2 py-1.5">
                    <span className="flex items-center gap-1.5">
                      <CircleDollarSign className="size-3.5 text-primary" />
                      Draft 5 follow-up emails
                    </span>
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[0.625rem] font-medium text-primary-foreground">
                      Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        Product preview with sample data.
      </figcaption>
    </figure>
  );
}
