import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/*
 * Small layout helpers for form fields. They stay framework-agnostic so the same markup
 * works with react-hook-form, plain server actions or uncontrolled inputs.
 */

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("grid content-start gap-2", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn(className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-[0.8125rem] text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  children,
  ...props
}: React.ComponentProps<"p"> & { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn("text-[0.8125rem] font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export { Field, FieldLabel, FieldDescription, FieldError };
