import type { MetadataRoute } from "next";

// Crawl policy (SEO starter guide): the marketing site is fully indexable;
// the authenticated app and the auth funnel are not meant for search.
// robots.txt controls CRAWLING — the (public) and /app layouts additionally
// send noindex so already-known URLs drop out of the index too.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/app/",
        "/onboarding",
        "/login",
        "/register",
        "/forgot-password",
        "/complete-profile",
        "/google-callback",
        "/link",
      ],
    },
    sitemap: "https://tryamiva.com/sitemap.xml",
  };
}
