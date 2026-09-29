import { BarChart3, FileSearch, FolderKanban, Receipt, Users, Workflow } from "lucide-react";

import { SectionHeading } from "@/modules/marketing/components/section-heading";

const FEATURES = [
  {
    icon: Users,
    title: "CRM and sales pipeline",
    body: "Leads, customers and deals with a drag-and-drop pipeline, follow-up reminders and a complete 360° customer timeline.",
  },
  {
    icon: FolderKanban,
    title: "Projects and tasks",
    body: "Plan projects with budgets and deadlines, then run the work in list, Kanban or calendar views with comments and assignments.",
  },
  {
    icon: Receipt,
    title: "Invoices and finance",
    body: "Professional invoices with secure public links and PDFs, recorded payments, expenses and a live view of profit.",
  },
  {
    icon: FileSearch,
    title: "Document intelligence",
    body: "Upload contracts and proposals, then ask questions in plain language. Every answer links to the passage it came from.",
  },
  {
    icon: Workflow,
    title: "Workflow automation",
    body: "When a lead is created or an invoice goes overdue, assign it, create a task or notify the team, with retries and history.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "Revenue, pipeline, conversion and team workload with date ranges and filters, plus AI explanations grounded in the numbers.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="scroll-mt-20 border-b py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="features-heading"
          eyebrow="Everything in one place"
          title="The modules a service business actually runs on"
          description="Each module shares the same customers, team and permissions, so nothing has to be copied between tools."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card p-6">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
