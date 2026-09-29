import { Layers, SearchX, Unplug } from "lucide-react";

import { SectionHeading } from "@/modules/marketing/components/section-heading";

const PROBLEMS = [
  {
    icon: Layers,
    title: "Six tools for one business",
    body: "A CRM, a project board, an invoicing app, a drive and a chatbot. Each with its own login and its own half of the story.",
  },
  {
    icon: SearchX,
    title: "Answers take an afternoon",
    body: "Which clients are overdue? Which leads went cold? Finding out means exporting spreadsheets from three places.",
  },
  {
    icon: Unplug,
    title: "AI that can't see your business",
    body: "Generic chat assistants don't know your customers or invoices, and you wouldn't trust them to act on their own anyway.",
  },
];

export function Problems() {
  return (
    <section aria-labelledby="problems-heading" className="border-b py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="problems-heading"
          eyebrow="Why Operiq"
          title="Running a business shouldn't mean running a software stack"
          description="Operiq puts customers, work, money and documents in one workspace, so the whole picture is in one place, for you and for the AI."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6">
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
