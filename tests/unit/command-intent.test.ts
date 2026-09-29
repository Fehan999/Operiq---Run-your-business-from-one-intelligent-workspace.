import { describe, expect, it } from "vitest";

import { detectCommandIntent } from "@/modules/command/intent";

describe("detectCommandIntent", () => {
  it.each([
    ["Find ACME.", "search", "ACME"],
    ["acme", "search", "acme"],
    ["search for overdue invoices", "search", "overdue invoices"],
    ["Show overdue invoices.", "ask", "Show overdue invoices."],
    ["Which leads need follow-up?", "ask", "Which leads need follow-up?"],
    ["Summarize Project Alpha", "ask", "Summarize Project Alpha"],
    ["How much revenue did we make this month?", "ask", "How much revenue did we make this month?"],
    [
      "revenue this month compared to last month",
      "ask",
      "revenue this month compared to last month",
    ],
    ["Create a task to call John tomorrow", "action", "Create a task to call John tomorrow"],
    ["Prepare an invoice for ACME", "action", "Prepare an invoice for ACME"],
    ["invite sara@novadigital.co", "action", "invite sara@novadigital.co"],
    ["go to settings", "navigate", "settings"],
    ["open members", "navigate", "members"],
  ])("%s -> %s", (input, intent, query) => {
    expect(detectCommandIntent(input)).toEqual({ intent, query });
  });

  it("treats an empty box as navigation", () => {
    expect(detectCommandIntent("   ")).toEqual({ intent: "navigate", query: "" });
  });

  it("collapses whitespace", () => {
    expect(detectCommandIntent("  find   acme   corp ").query).toBe("acme corp");
  });
});
