import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  hasPermission,
  PERMISSION_GROUPS,
  ROLE_DETAILS,
  ROLES,
} from "@/lib/authorization/permissions";
import { cn } from "@/lib/utils";
import { getWorkspaceContext } from "@/modules/organizations/context";
import { SettingsSection } from "@/modules/settings/components/settings-section";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesSettingsPage({ params }: PageProps<"/w/[slug]/settings/roles">) {
  const { slug } = await params;
  const { role: currentRole } = await getWorkspaceContext(slug);

  return (
    <div className="grid gap-6">
      <SettingsSection
        title="Roles"
        description="Every member has one role per workspace. Permissions are enforced on the server for every action, including actions the AI agent takes."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <li
              key={role}
              className={cn(
                "rounded-lg border p-3",
                role === currentRole && "border-primary bg-primary/5",
              )}
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                {ROLE_DETAILS[role].label}
                {role === currentRole ? <Badge variant="secondary">Your role</Badge> : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{ROLE_DETAILS[role].description}</p>
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection title="Permissions" description="What each role can do in this workspace.">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-48">Permission</TableHead>
              {ROLES.map((role) => (
                <TableHead key={role} className="text-center">
                  {ROLE_DETAILS[role].label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_GROUPS.map((group) => (
              <PermissionGroupRows
                key={group.label}
                label={group.label}
                permissions={group.permissions}
              />
            ))}
          </TableBody>
        </Table>
      </SettingsSection>
    </div>
  );
}

function PermissionGroupRows({
  label,
  permissions,
}: {
  label: string;
  permissions: (typeof PERMISSION_GROUPS)[number]["permissions"];
}) {
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell
          colSpan={ROLES.length + 1}
          className="py-2 text-xs font-semibold text-muted-foreground"
        >
          {label}
        </TableCell>
      </TableRow>
      {permissions.map((permission) => (
        <TableRow key={permission.key}>
          <TableCell className="text-sm">{permission.label}</TableCell>
          {ROLES.map((role) => (
            <TableCell key={role} className="text-center">
              {hasPermission(role, permission.key) ? (
                <Check className="mx-auto size-4 text-primary" aria-label="Allowed" />
              ) : (
                <Minus
                  className="mx-auto size-4 text-muted-foreground/50"
                  aria-label="Not allowed"
                />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
