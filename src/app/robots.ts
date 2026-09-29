import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private areas. They also send X-Robots-Tag: noindex, this just saves crawl budget.
        disallow: [
          "/w/",
          "/dashboard",
          "/onboarding",
          "/invite/",
          "/verify-email",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
