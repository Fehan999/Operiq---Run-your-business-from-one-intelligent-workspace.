"use client";

import { createContext, useContext, useMemo, useState } from "react";

import type { Permission, Role } from "@/lib/authorization/permissions";

export interface ShellWorkspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
}

export interface ShellUser {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface ShellData {
  workspace: ShellWorkspace;
  user: ShellUser;
  role: Role;
  permissions: Permission[];
  workspaces: Array<{ id: string; name: string; slug: string; logoUrl: string | null; role: Role }>;
}

interface ShellState extends ShellData {
  commandOpen: boolean;
  setCommandOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  can: (permission: Permission) => boolean;
}

const ShellContext = createContext<ShellState | null>(null);

/**
 * Client-side state for the workspace chrome: which workspace is open, the signed-in
 * user, and whether the command palette or the mobile menu is showing.
 * Permissions here only decide what to render; the server re-checks every action.
 */
export function ShellProvider({ data, children }: { data: ShellData; children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const value = useMemo<ShellState>(() => {
    const granted = new Set(data.permissions);
    return {
      ...data,
      commandOpen,
      setCommandOpen,
      mobileNavOpen,
      setMobileNavOpen,
      can: (permission) => granted.has(permission),
    };
  }, [data, commandOpen, mobileNavOpen]);

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellState {
  const context = useContext(ShellContext);
  if (!context) throw new Error("useShell must be used inside ShellProvider");
  return context;
}
