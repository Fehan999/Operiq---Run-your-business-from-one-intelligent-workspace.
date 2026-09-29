import type { OnboardingStep } from "@/generated/prisma/enums";

/*
 * Workspace setup happens in steps after the workspace itself is created. Progress is
 * stored on the organization, so closing the tab and coming back resumes where you left.
 */

export const ONBOARDING_STEPS = [
  {
    key: "business",
    step: "BUSINESS",
    title: "Tell us about the business",
    description: "Used for invoices, reports and to tailor your workspace.",
  },
  {
    key: "brand",
    step: "BRAND",
    title: "Add your logo",
    description: "It appears in the sidebar, on invoices and in client-facing pages.",
  },
  {
    key: "goals",
    step: "GOALS",
    title: "What do you want Operiq to help with?",
    description: "We use this to decide what to show first. You can change it any time.",
  },
  {
    key: "team",
    step: "TEAM",
    title: "Invite your team",
    description: "Operiq works best with everyone in one place. You can also do this later.",
  },
] as const satisfies ReadonlyArray<{
  key: string;
  step: Exclude<OnboardingStep, "COMPLETED">;
  title: string;
  description: string;
}>;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]["key"];

const ORDER: OnboardingStep[] = ["BUSINESS", "BRAND", "GOALS", "TEAM", "COMPLETED"];

export function isOnboardingStepKey(value: string): value is OnboardingStepKey {
  return ONBOARDING_STEPS.some((step) => step.key === value);
}

export function stepForKey(key: OnboardingStepKey) {
  const index = ONBOARDING_STEPS.findIndex((step) => step.key === key);
  return { ...ONBOARDING_STEPS[index]!, index };
}

export function keyForStep(step: OnboardingStep): OnboardingStepKey | null {
  return ONBOARDING_STEPS.find((item) => item.step === step)?.key ?? null;
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  const index = ORDER.indexOf(step);
  return ORDER[Math.min(index + 1, ORDER.length - 1)]!;
}

/** Progress never moves backwards when someone revisits an earlier step. */
export function furthestStep(current: OnboardingStep, candidate: OnboardingStep): OnboardingStep {
  return ORDER.indexOf(candidate) > ORDER.indexOf(current) ? candidate : current;
}
