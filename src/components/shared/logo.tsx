import { cn } from "@/lib/utils";

/**
 * The Operiq mark: a workspace frame with an orbit, suggesting one place where
 * everything moves together. Drawn inline so it inherits color and needs no request.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <circle cx="16" cy="16" r="7.25" className="stroke-primary-foreground" strokeWidth="2.5" />
      <circle cx="21.6" cy="10.4" r="2.6" className="fill-primary-foreground" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className="text-[1.0625rem] font-semibold tracking-tight">Operiq</span>
    </span>
  );
}
