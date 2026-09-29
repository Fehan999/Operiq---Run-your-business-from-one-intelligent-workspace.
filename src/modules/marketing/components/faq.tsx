import { ChevronDown } from "lucide-react";

import { FAQ_ITEMS } from "@/modules/marketing/faq";
import { SectionHeading } from "@/modules/marketing/components/section-heading";

/** Native details/summary: keyboard accessible and works before any JavaScript loads. */
export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-20 border-b py-20 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading id="faq-heading" eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 divide-y rounded-xl border bg-card">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                {item.question}
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
