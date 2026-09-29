import {
  CheckCircle2,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { SectionHeading } from "@/modules/marketing/components/section-heading";

const STEPS = [
  {
    icon: MessageSquareText,
    title: "You ask",
    body: '"Prepare follow-ups for the five highest-value leads."',
  },
  {
    icon: Sparkles,
    title: "The agent reads your data",
    body: "Through typed tools that respect your role and your workspace.",
  },
  {
    icon: ShieldCheck,
    title: "Permissions are checked",
    body: "The same server-side rules that apply to you apply to the AI.",
  },
  {
    icon: UserCheck,
    title: "You approve",
    body: "A clear card shows exactly what will be sent, created or changed.",
  },
  {
    icon: CheckCircle2,
    title: "It runs",
    body: "The server validates again, performs the action and reports back.",
  },
  {
    icon: ScrollText,
    title: "It's on the record",
    body: "The proposal, your approval and the result land in the audit log.",
  },
];

export function AiApproval() {
  return (
    <section
      id="ai"
      aria-labelledby="ai-heading"
      className="scroll-mt-20 border-b bg-sidebar py-20 sm:py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            id="ai-heading"
            align="left"
            eyebrow="AI business agent"
            title="An assistant that knows your business and waits for your go-ahead"
            description="Operiq's agent isn't a chat window bolted on. It works with your real customers, projects and invoices through controlled tools, and anything important goes through you first."
          />
          <p className="mt-6 text-sm text-muted-foreground">
            Reading data happens instantly. Writing data and anything that leaves the workspace,
            like sending an email or an invoice, always needs an explicit approval.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
