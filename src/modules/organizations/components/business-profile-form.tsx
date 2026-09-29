"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { SearchableSelect } from "@/components/shared/searchable-select";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPANY_SIZES, CURRENCIES, INDUSTRIES, listTimezones } from "@/config/workspace-options";
import { cn } from "@/lib/utils";
import { saveBusinessProfileAction } from "@/modules/organizations/actions";
import { businessProfileSchema, type BusinessProfileInput } from "@/modules/organizations/schemas";

export interface BusinessProfileDefaults {
  industry: string | null;
  companySize: string | null;
  currency: string;
  timezone: string;
  website: string | null;
}

function guessTimezone(fallback: string) {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

export function BusinessProfileForm({
  slug,
  defaults,
  mode,
  disabled,
}: {
  slug: string;
  defaults: BusinessProfileDefaults;
  mode: "onboarding" | "settings";
  disabled?: boolean;
}) {
  const router = useRouter();
  const timezoneOptions = useMemo(
    () => listTimezones().map((zone) => ({ value: zone, label: zone.replaceAll("_", " ") })),
    [],
  );
  const currencyOptions = useMemo(
    () =>
      CURRENCIES.map((c) => ({ value: c.value, label: c.label, hint: `${c.value} ${c.symbol}` })),
    [],
  );

  const form = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      industry: (defaults.industry ?? undefined) as BusinessProfileInput["industry"],
      companySize: (defaults.companySize ?? undefined) as BusinessProfileInput["companySize"],
      currency: defaults.currency as BusinessProfileInput["currency"],
      // New workspaces default to the browser's zone instead of UTC.
      timezone:
        mode === "onboarding" && defaults.timezone === "UTC"
          ? guessTimezone(defaults.timezone)
          : defaults.timezone,
      website: defaults.website ?? "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: BusinessProfileInput) {
    const result = await saveBusinessProfileAction(slug, values, {
      onboarding: mode === "onboarding",
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.data.redirectTo) {
      router.push(result.data.redirectTo);
    } else {
      toast.success(result.message ?? "Saved.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <fieldset disabled={disabled} className="grid gap-5">
        <Field>
          <FieldLabel htmlFor="industry">Industry</FieldLabel>
          <Controller
            control={form.control}
            name="industry"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="industry" aria-invalid={Boolean(errors.industry)}>
                  <SelectValue placeholder="Choose an industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.industry?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel id="company-size-label">Company size</FieldLabel>
          <Controller
            control={form.control}
            name="companySize"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-labelledby="company-size-label"
                className="grid grid-cols-2 gap-2 sm:grid-cols-5"
              >
                {COMPANY_SIZES.map((size) => {
                  const checked = field.value === size.value;
                  return (
                    <button
                      key={size.value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => field.onChange(size.value)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        checked
                          ? "border-primary bg-primary/10 font-medium text-foreground ring-1 ring-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
          <FieldError>{errors.companySize?.message}</FieldError>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="currency">Currency</FieldLabel>
            <Controller
              control={form.control}
              name="currency"
              render={({ field }) => (
                <SearchableSelect
                  id="currency"
                  value={field.value}
                  onChange={field.onChange}
                  options={currencyOptions}
                  placeholder="Choose a currency"
                  searchPlaceholder="Search currencies"
                  invalid={Boolean(errors.currency)}
                />
              )}
            />
            <FieldError>{errors.currency?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="timezone">Time zone</FieldLabel>
            <Controller
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <SearchableSelect
                  id="timezone"
                  value={field.value}
                  onChange={field.onChange}
                  options={timezoneOptions}
                  placeholder="Choose a time zone"
                  searchPlaceholder="Search time zones"
                  invalid={Boolean(errors.timezone)}
                />
              )}
            />
            <FieldError>{errors.timezone?.message}</FieldError>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="website">
            Website <span className="font-normal text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="website"
            type="url"
            inputMode="url"
            placeholder="https://yourcompany.com"
            aria-invalid={Boolean(errors.website)}
            {...form.register("website")}
          />
          <FieldError>{errors.website?.message}</FieldError>
        </Field>
      </fieldset>

      {disabled ? null : (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            {mode === "onboarding" ? "Continue" : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}
