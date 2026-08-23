import type { MetadataRoute } from "next";

// Every indexable page. lastModified is the build date — these pages only
// change with a deploy.
export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date();
  return [
    { url: "https://tryamiva.com/", lastModified: built, changeFrequency: "weekly", priority: 1 },
    { url: "https://tryamiva.com/terms", lastModified: built, changeFrequency: "monthly", priority: 0.3 },
    { url: "https://tryamiva.com/privacy-policy", lastModified: built, changeFrequency: "monthly", priority: 0.3 },
  ];
}
