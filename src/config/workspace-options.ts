/*
 * Choices offered during onboarding and in workspace settings. They live in config so the
 * validation schemas, the forms and the settings pages all read from the same source.
 */

export const INDUSTRIES = [
  { value: "agency", label: "Marketing or creative agency" },
  { value: "software", label: "Software and development" },
  { value: "consulting", label: "Consulting and professional services" },
  { value: "freelance", label: "Freelancing" },
  { value: "ecommerce", label: "E-commerce and retail" },
  { value: "real-estate", label: "Real estate" },
  { value: "health", label: "Health and wellness" },
  { value: "education", label: "Education and coaching" },
  { value: "finance", label: "Finance and accounting" },
  { value: "construction", label: "Construction and trades" },
  { value: "hospitality", label: "Hospitality and events" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "other", label: "Something else" },
] as const;

export type Industry = (typeof INDUSTRIES)[number]["value"];

export const COMPANY_SIZES = [
  { value: "JUST_ME", label: "Just me" },
  { value: "SIZE_2_10", label: "2 to 10" },
  { value: "SIZE_11_50", label: "11 to 50" },
  { value: "SIZE_51_200", label: "51 to 200" },
  { value: "SIZE_201_PLUS", label: "More than 200" },
] as const;

export type CompanySizeValue = (typeof COMPANY_SIZES)[number]["value"];

export const CURRENCIES = [
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "BDT", label: "Bangladeshi Taka", symbol: "৳" },
  { value: "INR", label: "Indian Rupee", symbol: "₹" },
  { value: "PKR", label: "Pakistani Rupee", symbol: "₨" },
  { value: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { value: "SAR", label: "Saudi Riyal", symbol: "﷼" },
  { value: "CAD", label: "Canadian Dollar", symbol: "$" },
  { value: "AUD", label: "Australian Dollar", symbol: "$" },
  { value: "SGD", label: "Singapore Dollar", symbol: "$" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥" },
  { value: "CHF", label: "Swiss Franc", symbol: "Fr" },
  { value: "SEK", label: "Swedish Krona", symbol: "kr" },
  { value: "BRL", label: "Brazilian Real", symbol: "R$" },
  { value: "ZAR", label: "South African Rand", symbol: "R" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["value"];

export const BUSINESS_GOALS = [
  {
    value: "win-more-deals",
    label: "Win more deals",
    description: "Track leads and never miss a follow-up.",
  },
  {
    value: "deliver-projects",
    label: "Deliver projects on time",
    description: "Plan work and keep the team aligned.",
  },
  {
    value: "get-paid-faster",
    label: "Get paid faster",
    description: "Send invoices and chase overdue payments.",
  },
  {
    value: "understand-numbers",
    label: "Understand the numbers",
    description: "See revenue, profit and pipeline at a glance.",
  },
  {
    value: "automate-busywork",
    label: "Automate busywork",
    description: "Let workflows handle the repetitive steps.",
  },
  {
    value: "organize-documents",
    label: "Organize documents",
    description: "Keep contracts and proposals searchable.",
  },
  {
    value: "use-ai",
    label: "Put AI to work",
    description: "Ask questions and draft actions from your own data.",
  },
] as const;

export type BusinessGoal = (typeof BUSINESS_GOALS)[number]["value"];

export function listTimezones(): string[] {
  try {
    // The IANA list from Intl leaves out plain "UTC", which is our default, so add it first.
    return ["UTC", ...Intl.supportedValuesOf("timeZone").filter((zone) => zone !== "UTC")];
  } catch {
    return ["UTC"];
  }
}

export function isValidTimezone(value: string): boolean {
  if (value === "UTC") return true;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
