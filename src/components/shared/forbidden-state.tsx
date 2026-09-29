import { Lock } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

/** Rendered in place of a page when the member's role does not allow it. */
export function ForbiddenState({
  title = "You don't have access to this page",
  description = "Ask a workspace owner or admin if you think you should.",
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState icon={Lock} title={title} description={description} className="py-16" />;
}
