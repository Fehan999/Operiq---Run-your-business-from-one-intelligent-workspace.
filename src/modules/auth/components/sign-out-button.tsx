"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";

export function SignOutButton() {
  const { signOut, pending } = useSignOut();

  return (
    <Button variant="ghost" size="sm" onClick={signOut} loading={pending}>
      {pending ? null : <LogOut aria-hidden />}
      Sign out
    </Button>
  );
}
