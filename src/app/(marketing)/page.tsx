import type { Metadata } from "next";

import { JsonLd } from "@/components/shared/json-ld";
import { PLANS } from "@/config/plans";
import { siteConfig } from "@/config/site";
import { AiApproval } from "@/modules/marketing/components/ai-approval";
import { Faq } from "@/modules/marketing/components/faq";
import { Features } from "@/modules/marketing/components/features";
import { FinalCta } from "@/modules/marketing/components/final-cta";
import { Hero } from "@/modules/marketing/components/hero";
import { Pricing } from "@/modules/marketing/components/pricing";
import { Problems } from "@/modules/marketing/components/problems";
import { Security } from "@/modules/marketing/components/security";
import { FAQ_ITEMS } from "@/modules/marketing/faq";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function structuredData() {
  const author = {
    "@type": "Person",
    name: siteConfig.author.name,
    url: siteConfig.author.website,
    jobTitle: siteConfig.author.role,
    sameAs: [siteConfig.author.github, siteConfig.author.linkedin].filter(Boolean),
  };

  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      author,
      creator: author,
      offers: Object.values(PLANS).map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: plan.priceMonthly,
        priceCurrency: "USD",
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData()} />
      <Hero />
      <Problems />
      <Features />
      <AiApproval />
      <Security />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
