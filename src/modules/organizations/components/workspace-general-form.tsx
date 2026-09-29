"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateWorkspaceGeneralAction } from "@/modules/organizations/actions";
import {
  workspaceGeneralSchema,
  type WorkspaceGeneralInput,
} from "@/modules/organizations/schemas";

export function WorkspaceGeneralForm({
  slug,
  defaults,
  urlPrefix,
  disabled,
}: {
  slug: string;
  defaults: WorkspaceGeneralInput;
  urlPrefix: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const form = useForm<WorkspaceGeneralInput>({
    resolver: zodResolver(workspaceGeneralSchema),
    defaultValues: defaults,
  });
  const { errors, isSubmitting, isDirty } = form.formState;

  async function onSubmit(values: WorkspaceGeneralInput) {
    const result = await updateWorkspaceGeneralAction(slug, values);
    if (!result.ok) {
      const slugError = result.fieldErrors?.slug?.[0];
      if (slugError) form.setError("slug", { message: slugError });
      else toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved.");
    form.reset(values);
    if (result.data.slug !== slug) {
      router.replace(`/w/${result.data.slug}/settings/workspace`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <fieldset disabled={disabled} className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
          <Input
            id="workspace-name"
            aria-invalid={Boolean(errors.name)}
            {...form.register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="workspace-slug">Workspace address</FieldLabel>
          <div className="flex rounded-md shadow-xs">
            <span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
              {urlPrefix}
            </span>
            <Input
              id="workspace-slug"
              className="rounded-l-none shadow-none"
              aria-invalid={Boolean(errors.slug)}
              {...form.register("slug")}
            />
          </div>
          <FieldDescription>Changing this breaks old bookmarks to this workspace.</FieldDescription>
          <FieldError>{errors.slug?.message}</FieldError>
        </Field>
      </fieldset>
      {disabled ? null : (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}
