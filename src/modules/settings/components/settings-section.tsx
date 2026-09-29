import { cn } from "@/lib/utils";

/** A titled block inside a settings page. */
export function SettingsSection({
  id,
  title,
  description,
  children,
  className,
  actions,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("rounded-xl border bg-card shadow-xs", className)}
    >
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="grid gap-1">
          <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold">
            {title}
          </h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
