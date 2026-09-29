import { publicEnv } from "@/config/public-env";

export const siteConfig = {
  name: "Operiq",
  tagline: "Your business. One intelligent workspace.",
  description:
    "Operiq brings your CRM, projects, finance, documents and workflows into one workspace, with an AI agent that understands your business data and only acts with your approval.",
  url: publicEnv.appUrl,
  keywords: [
    "Operiq",
    "business operating system",
    "AI CRM",
    "project management",
    "invoicing software",
    "workflow automation",
    "AI business agent",
    "small business software",
    "agency management",
    "Ehan Siddique",
  ],
  author: {
    name: "Ehan Siddique",
    role: "Full-stack engineer",
    website: "https://ehansiddique.com",
    github: "https://github.com/Fehan999",
    linkedin: publicEnv.authorLinkedinUrl,
  },
  repository:
    "https://github.com/Fehan999/Operiq---Run-your-business-from-one-intelligent-workspace.",
} as const;

export type SiteConfig = typeof siteConfig;
