import { Building2, KeyRound, Lock, ScrollText, ShieldCheck, UserCog } from "lucide-react";

import { SectionHeading } from "@/modules/marketing/components/section-heading";

const POINTS = [
  {
    icon: Building2,
    title: "Tenant isolation",
    body: "Every query is scoped to a workspace resolved from your membership, never from an id sent by the browser.",
  },
  {
    icon: UserCog,
    title: "Role-based access",
    body: "Owner, admin, manager, member and viewer roles, enforced on the server for every action.",
  },
  {
    icon: ScrollText,
    title: "Append-only audit log",
    body: "Sign-ins, role changes and approvals are recorded, and the database itself refuses edits to the log.",
  },
  {
    icon: KeyRound,
    title: "Hardened sessions",
    body: "httpOnly cookies, hashed session tokens, instant revocation and a list of every active device.",
  },
  {
    icon: ShieldCheck,
    title: "AI with guardrails",
    body: "The agent uses the same permissions as you and cannot take an important action without approval.",
  },
  {
    icon: Lock,
    title: "Safe by default",
    body: "Validated input everywhere, rate limiting, strict upload checks and security headers on every response.",
  },
];

const INTEGRATIONS = ["Google Calendar", "Gmail", "Slack", "GitHub", "Stripe", "Webhooks"];

export function Security() {
  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="scroll-mt-20 border-b py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="security-heading"
          eyebrow="Security"
          title="Built like your business depends on it"
          description="Because it will. Security isn't a later phase in Operiq, it's the foundation every module is built on."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-xl border bg-card p-5">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">Integrations on the roadmap</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {INTEGRATIONS.map((name) => (
              <li
                key={name}
                className="rounded-full border px-3 py-1 text-sm text-muted-foreground"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
