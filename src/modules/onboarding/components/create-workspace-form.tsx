"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { checkSlugAction, createWorkspaceAction } from "@/modules/organizations/actions";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@/modules/organizations/schemas";
import { slugify } from "@/modules/organizations/slug";

type SlugCheck = { slug: string; available: boolean; reason?: string };

export function CreateWorkspaceForm({ urlPrefix }: { urlPrefix: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [lastCheck, setLastCheck] = useState<SlugCheck | null>(null);

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "", slug: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const slug = useWatch({ control: form.control, name: "slug" }) ?? "";

  // Availability is checked a moment after typing stops. The status shown below is derived
  // from whether the latest answer belongs to the slug currently in the field.
  useEffect(() => {
    if (slug.length < 3) return;
    let active = true;
    const timer = setTimeout(async () => {
      const result = await checkSlugAction(slug);
      if (active && result.ok) {
        setLastCheck({ slug, available: result.data.available, reason: result.data.reason });
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [slug]);

  const status =
    slug.length < 3
      ? "idle"
      : lastCheck?.slug !== slug
        ? "checking"
        : lastCheck.available
          ? "available"
          : "unavailable";

  const nameField = form.register("name", {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      // Keep the address in sync with the name until the person edits it themselves.
      if (!slugEdited) form.setValue("slug", slugify(event.target.value));
    },
  });

  const slugField = form.register("slug", {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setSlugEdited(true);
      form.setValue("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    },
  });

  async function onSubmit(values: CreateWorkspaceInput) {
    setFormError(null);
    const result = await createWorkspaceAction(values);
    if (!result.ok) {
      if (result.fieldErrors?.slug?.[0]) {
        form.setError("slug", { message: result.fieldErrors.slug[0] });
      } else {
        setFormError(result.error);
      }
      return;
    }
    router.push(result.data.redirectTo);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Field>
        <FieldLabel htmlFor="name">Workspace name</FieldLabel>
        <Input
          id="name"
          autoFocus
          placeholder="Nova Digital Agency"
          autoComplete="organization"
          aria-invalid={Boolean(errors.name)}
          {...nameField}
        />
        <FieldDescription>Usually your company or team name.</FieldDescription>
        <FieldError>{errors.name?.message}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="slug">Workspace address</FieldLabel>
        <div className="flex rounded-md shadow-xs">
          <span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
            {urlPrefix}
          </span>
          <Input
            id="slug"
            className="rounded-l-none shadow-none"
            aria-invalid={Boolean(errors.slug) || status === "unavailable"}
            aria-describedby="slug-status"
            {...slugField}
          />
        </div>
        <div id="slug-status" aria-live="polite" className="min-h-5 text-[0.8125rem]">
          {errors.slug ? (
            <FieldError>{errors.slug.message}</FieldError>
          ) : status === "checking" ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Checking availability
            </span>
          ) : status === "available" ? (
            <span className="flex items-center gap-1.5 text-success">
              <CircleCheck className="size-3.5" aria-hidden /> Available
            </span>
          ) : status === "unavailable" ? (
            <span className="flex items-center gap-1.5 text-destructive">
              <CircleX className="size-3.5" aria-hidden /> {lastCheck?.reason ?? "Not available."}
            </span>
          ) : null}
        </div>
      </Field>

      <Button
        type="submit"
        size="lg"
        loading={isSubmitting}
        disabled={status === "unavailable" || status === "checking"}
      >
        Create workspace
      </Button>
    </form>
  );
}
