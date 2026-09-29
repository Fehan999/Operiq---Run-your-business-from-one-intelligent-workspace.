export const FAQ_ITEMS = [
  {
    question: "Who is Operiq for?",
    answer:
      "Freelancers, agencies, consultancies, startups and small service businesses that want customers, projects, invoices and documents in one place instead of five separate tools.",
  },
  {
    question: "Can the AI agent change my data on its own?",
    answer:
      "No. The agent can read what your role allows. Anything that writes data or leaves the workspace, such as sending an email or an invoice, is shown to you as a proposal and only runs after you approve it. Every step is recorded in the audit log.",
  },
  {
    question: "How is my data kept separate from other companies?",
    answer:
      "Every record belongs to a workspace, and the server resolves your workspace from your membership on every request. An id sent by the browser is never trusted on its own, and there are automated tests that try to read across workspaces.",
  },
  {
    question: "Can I use Operiq with my team?",
    answer:
      "Yes. Invite teammates by email and give each one a role: owner, admin, manager, member or viewer. You can belong to several workspaces, for example your agency and a side business.",
  },
  {
    question: "Does Operiq replace my accountant?",
    answer:
      "No. Operiq handles invoices, payments, expenses and profit at a glance. It is not full accounting software, and it's designed to hand clean numbers to your accountant.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The free plan includes up to three team members and the core workspace, with no credit card required.",
  },
] as const;
