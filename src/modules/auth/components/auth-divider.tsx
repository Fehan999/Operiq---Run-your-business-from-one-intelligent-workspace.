export function AuthDivider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="relative flex items-center" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-border" />
      <span className="px-3 text-xs text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
