import type { Plan } from "@/generated/prisma/enums";

/*
 * Central plan entitlements. Feature checks and limits read from here instead of
 * hardcoding numbers around the codebase, so changing a plan is a one-file edit.
 * Billing (Phase 9) will attach real subscriptions; until then every workspace is FREE.
 */

export type LimitKey = "members" | "customers" | "aiRequestsPerMonth" | "storageMb" | "automations";
export type FeatureKey =
  "aiAgent" | "documentAi" | "automations" | "advancedAnalytics" | "auditLog" | "integrations";

export interface PlanDefinition {
  name: string;
  description: string;
  priceMonthly: number;
  limits: Record<LimitKey, number>;
  features: Record<FeatureKey, boolean>;
}

export const PLANS: Record<Plan, PlanDefinition> = {
  FREE: {
    name: "Free",
    description: "For freelancers getting organized.",
    priceMonthly: 0,
    limits: { members: 3, customers: 100, aiRequestsPerMonth: 50, storageMb: 500, automations: 2 },
    features: {
      aiAgent: true,
      documentAi: false,
      automations: true,
      advancedAnalytics: false,
      auditLog: true,
      integrations: false,
    },
  },
  PRO: {
    name: "Pro",
    description: "For growing teams that run their business in Operiq.",
    priceMonthly: 29,
    limits: {
      members: 15,
      customers: 10_000,
      aiRequestsPerMonth: 2_000,
      storageMb: 20_000,
      automations: 50,
    },
    features: {
      aiAgent: true,
      documentAi: true,
      automations: true,
      advancedAnalytics: true,
      auditLog: true,
      integrations: true,
    },
  },
  BUSINESS: {
    name: "Business",
    description: "For agencies and companies with larger teams.",
    priceMonthly: 79,
    limits: {
      members: 100,
      customers: 100_000,
      aiRequestsPerMonth: 20_000,
      storageMb: 200_000,
      automations: 500,
    },
    features: {
      aiAgent: true,
      documentAi: true,
      automations: true,
      advancedAnalytics: true,
      auditLog: true,
      integrations: true,
    },
  },
};

export function getPlan(plan: Plan): PlanDefinition {
  return PLANS[plan];
}

export function getLimit(plan: Plan, key: LimitKey): number {
  return PLANS[plan].limits[key];
}

export function hasFeature(plan: Plan, feature: FeatureKey): boolean {
  return PLANS[plan].features[feature];
}
