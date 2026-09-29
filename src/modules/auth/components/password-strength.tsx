import { cn } from "@/lib/utils";
import { passwordStrength } from "@/modules/auth/schemas";

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;
const COLORS = ["bg-muted", "bg-destructive", "bg-warning", "bg-chart-1", "bg-success"] as const;

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordStrength(password);

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              step <= score ? COLORS[score] : "bg-muted",
            )}
          />
        ))}
      </div>
      <span className="w-14 text-right text-xs text-muted-foreground">{LABELS[score]}</span>
    </div>
  );
}
