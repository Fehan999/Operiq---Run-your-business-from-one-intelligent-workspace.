import { Badge } from "@/components/ui/badge";
import { ROLE_DETAILS, type Role } from "@/lib/authorization/permissions";

const VARIANTS: Record<Role, "default" | "secondary" | "outline" | "muted"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MANAGER: "secondary",
  MEMBER: "outline",
  VIEWER: "muted",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={VARIANTS[role]}>{ROLE_DETAILS[role].label}</Badge>;
}
