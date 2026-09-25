import type { MetadataRoute } from "next";
import { getTenant } from "@/tenant/get-tenant";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await getTenant();
  const base = tenant.seo.canonicalBase || "";
  const isProduction = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";

  return {
    rules: isProduction
      ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }]
      : [{ userAgent: "*", disallow: "/" }], // never index preview/staging deploys
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
