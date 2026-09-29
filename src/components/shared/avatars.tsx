import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

export function UserAvatar({
  name,
  email,
  avatarUrl,
  className,
}: {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
      <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
    </Avatar>
  );
}

export function WorkspaceAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("rounded-md", className)}>
      {logoUrl ? <AvatarImage src={logoUrl} alt="" className="object-contain" /> : null}
      <AvatarFallback className="rounded-md bg-primary/12 text-[0.6875rem] font-semibold text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
