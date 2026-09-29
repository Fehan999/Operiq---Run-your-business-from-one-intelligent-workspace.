import {
  BarChart3,
  Calendar,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Settings,
  Sparkles,
  SquareKanban,
  UserRoundPlus,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/authorization/permissions";

/*
 * Sidebar and command palette navigation. Paths are relative to /w/<slug>.
 * Modules that are not built yet are listed as "soon" so the product structure is
 * visible without linking to pages that don't exist.
 */

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  status: "ready" | "soon";
  permission?: Permission;
  keywords?: string[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const WORKSPACE_NAV: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        status: "ready",
        keywords: ["home", "overview"],
      },
      {
        title: "AI Assistant",
        path: "/assistant",
        icon: Sparkles,
        status: "soon",
        permission: "ai:use",
        keywords: ["chat", "agent"],
      },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        title: "Leads",
        path: "/leads",
        icon: UserRoundPlus,
        status: "soon",
        keywords: ["prospects"],
      },
      {
        title: "Customers",
        path: "/customers",
        icon: Users,
        status: "soon",
        permission: "customers:view",
        keywords: ["clients", "contacts"],
      },
      {
        title: "Pipeline",
        path: "/pipeline",
        icon: SquareKanban,
        status: "soon",
        keywords: ["deals", "sales"],
      },
    ],
  },
  {
    title: "Work",
    items: [
      { title: "Projects", path: "/projects", icon: FolderKanban, status: "soon" },
      { title: "Tasks", path: "/tasks", icon: ListChecks, status: "soon", keywords: ["todo"] },
      {
        title: "Calendar",
        path: "/calendar",
        icon: Calendar,
        status: "soon",
        keywords: ["meetings"],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        title: "Invoices",
        path: "/invoices",
        icon: Receipt,
        status: "soon",
        permission: "finance:view",
        keywords: ["billing", "payments"],
      },
      {
        title: "Expenses",
        path: "/expenses",
        icon: Wallet,
        status: "soon",
        permission: "finance:view",
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        title: "Documents",
        path: "/documents",
        icon: FileText,
        status: "soon",
        keywords: ["files", "contracts"],
      },
      {
        title: "Analytics",
        path: "/analytics",
        icon: BarChart3,
        status: "soon",
        keywords: ["reports", "revenue"],
      },
      {
        title: "Automations",
        path: "/automations",
        icon: Workflow,
        status: "soon",
        keywords: ["workflows"],
      },
    ],
  },
];

export const SETTINGS_NAV_ITEM: NavItem = {
  title: "Settings",
  path: "/settings",
  icon: Settings,
  status: "ready",
};

export interface SettingsNavItem {
  title: string;
  path: string;
  status: "ready" | "soon";
  permission?: Permission;
  description: string;
}

export const SETTINGS_NAV: Array<{ title: string; items: SettingsNavItem[] }> = [
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        path: "/settings/profile",
        status: "ready",
        description: "Your name, photo and job title.",
      },
      {
        title: "Security",
        path: "/settings/security",
        status: "ready",
        description: "Active sessions and sign-in.",
      },
      {
        title: "Notifications",
        path: "/settings/notifications",
        status: "soon",
        description: "Email and in-app preferences.",
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        title: "General",
        path: "/settings/workspace",
        status: "ready",
        description: "Name, address, logo and business details.",
      },
      {
        title: "Members",
        path: "/settings/members",
        status: "ready",
        description: "Invite people and manage access.",
      },
      {
        title: "Roles",
        path: "/settings/roles",
        status: "ready",
        description: "What each role can do.",
      },
      {
        title: "Billing",
        path: "/settings/billing",
        status: "ready",
        permission: "workspace:update",
        description: "Plan, seats and usage.",
      },
      {
        title: "Audit log",
        path: "/settings/audit-log",
        status: "ready",
        permission: "audit:view",
        description: "Security events in this workspace.",
      },
      {
        title: "Integrations",
        path: "/settings/integrations",
        status: "soon",
        description: "Google, Slack and webhooks.",
      },
      {
        title: "AI",
        path: "/settings/ai",
        status: "soon",
        description: "How the AI agent behaves.",
      },
    ],
  },
];
