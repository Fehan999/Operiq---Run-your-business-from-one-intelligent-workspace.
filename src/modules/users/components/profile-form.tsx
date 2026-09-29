"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/modules/users/actions";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Use at most 80 characters."),
  jobTitle: z.string().trim().max(80, "Use at most 80 characters."),
});
type Values = z.infer<typeof schema>;

export function ProfileForm({
  slug,
  email,
  defaults,
  workspaceName,
}: {
  slug: string;
  email: string;
  defaults: Values;
  workspaceName: string;
}) {
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const { errors, isSubmitting, isDirty } = form.formState;

  async function onSubmit(values: Values) {
    const result = await updateProfileAction(slug, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Saved.");
    form.reset(values);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...form.register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="jobTitle">Job title</FieldLabel>
          <Input
            id="jobTitle"
            placeholder="Founder, Project manager..."
            autoComplete="organization-title"
            aria-invalid={Boolean(errors.jobTitle)}
            {...form.register("jobTitle")}
          />
          <FieldDescription>Shown to people in {workspaceName}.</FieldDescription>
          <FieldError>{errors.jobTitle?.message}</FieldError>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" value={email} readOnly disabled />
        <FieldDescription>Your sign-in email can&apos;t be changed here yet.</FieldDescription>
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
