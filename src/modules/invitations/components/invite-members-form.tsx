"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_DETAILS, type Role } from "@/lib/authorization/permissions";
import { inviteMembersAction } from "@/modules/invitations/actions";
import {
  inviteMembersSchema,
  MAX_INVITES_PER_REQUEST,
  type InviteMembersInput,
} from "@/modules/invitations/schemas";
import type { InvitationResult } from "@/modules/invitations/service";

export function InviteMembersForm({
  slug,
  assignableRoles,
  defaultRole = "MEMBER",
  onDone,
  submitLabel = "Send invitations",
}: {
  slug: string;
  assignableRoles: Role[];
  defaultRole?: Role;
  onDone?: () => void;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [results, setResults] = useState<InvitationResult[] | null>(null);
  const initialRole = assignableRoles.includes(defaultRole) ? defaultRole : assignableRoles.at(-1)!;

  const form = useForm<InviteMembersInput>({
    resolver: zodResolver(inviteMembersSchema),
    defaultValues: { invites: [{ email: "", role: initialRole }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "invites" });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: InviteMembersInput) {
    const result = await inviteMembersAction(slug, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setResults(result.data.results);
    const invited = result.data.results.filter((item) => item.status === "invited").length;
    if (invited > 0)
      toast.success(invited === 1 ? "Invitation created." : `${invited} invitations created.`);
    form.reset({ invites: [{ email: "", role: initialRole }] });
    router.refresh();
    onDone?.();
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-3">
        {fields.map((field, index) => {
          const fieldErrors = errors.invites?.[index];
          return (
            <div key={field.id} className="grid gap-1">
              <div className="flex items-start gap-2">
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  aria-label={`Email address ${index + 1}`}
                  aria-invalid={Boolean(fieldErrors?.email)}
                  className="flex-1"
                  {...form.register(`invites.${index}.email`)}
                />
                <Controller
                  control={form.control}
                  name={`invites.${index}.role`}
                  render={({ field: roleField }) => (
                    <Select value={roleField.value} onValueChange={roleField.onChange}>
                      <SelectTrigger className="w-32 shrink-0" aria-label={`Role ${index + 1}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_DETAILS[role].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label={`Remove row ${index + 1}`}
                >
                  <X aria-hidden />
                </Button>
              </div>
              <FieldError>{fieldErrors?.email?.message ?? fieldErrors?.role?.message}</FieldError>
            </div>
          );
        })}
        <FieldError>{errors.invites?.message ?? errors.invites?.root?.message}</FieldError>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ email: "", role: initialRole })}
            disabled={fields.length >= MAX_INVITES_PER_REQUEST}
          >
            <Plus aria-hidden />
            Add another
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>

      {results && results.length > 0 ? <InvitationResults results={results} /> : null}
    </div>
  );
}

function InvitationResults({ results }: { results: InvitationResult[] }) {
  return (
    <div className="grid gap-2 rounded-lg border bg-muted/30 p-3" aria-live="polite">
      <p className="text-xs font-medium text-muted-foreground">Latest invitations</p>
      <ul className="grid gap-2">
        {results.map((result) => (
          <li
            key={result.email}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span className="truncate">{result.email}</span>
            {result.status === "invited" ? (
              result.emailed ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <MailCheck className="size-3.5" aria-hidden /> Email sent
                </span>
              ) : result.inviteUrl ? (
                <CopyButton value={result.inviteUrl} label="Copy invite link" />
              ) : null
            ) : (
              <span className="text-xs text-muted-foreground">
                {result.status === "already_member" ? "Already a member" : "That's you"}
              </span>
            )}
          </li>
        ))}
      </ul>
      {results.some((result) => result.status === "invited" && !result.emailed) ? (
        <p className="text-xs text-muted-foreground">
          Email delivery isn&apos;t configured, so share these links directly. Each link only works
          for the address it was sent to.
        </p>
      ) : null}
    </div>
  );
}
