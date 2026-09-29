import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: siteConfig.url, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/register`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteConfig.url}/login`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
