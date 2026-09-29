import { BarChart3, FileText, Receipt, Sparkles, SquareKanban, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = [
  {
    icon: Users,
    title: "CRM and pipeline",
    detail: "Leads, customers, deals and a drag-and-drop pipeline.",
  },
  {
    icon: SquareKanban,
    title: "Projects and tasks",
    detail: "Kanban, list and calendar views with assignments.",
  },
  {
    icon: Receipt,
    title: "Invoices and expenses",
    detail: "Branded PDFs, public invoice links and payments.",
  },
  {
    icon: Sparkles,
    title: "AI business agent",
    detail: "Answers from your data, actions only after approval.",
  },
  {
    icon: FileText,
    title: "Document intelligence",
    detail: "Search contracts and proposals with cited sources.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    detail: "Revenue, pipeline and team workload in one place.",
  },
] as const;

export function RoadmapCard() {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Coming to your workspace</CardTitle>
        <CardDescription>The modules that plug into this workspace next.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2">
          {MODULES.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex items-start gap-3 rounded-lg border p-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div className="grid gap-0.5">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {title}
                  <Badge variant="muted">Soon</Badge>
                </p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
