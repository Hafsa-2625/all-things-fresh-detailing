import type { Metadata } from "next";
import "./public.css";
import { getTenant } from "@/tenant/get-tenant";
import { ALL_LOCALES, isLocale } from "@/i18n/locales";
import { notFound } from "next/navigation";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "es" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const tenant = await getTenant();
  const languages = Object.fromEntries(
    ALL_LOCALES.filter((l) => tenant.languages.enabled.includes(l)).map((l) => [l, l === "en" ? "/" : `/${l}`]),
  );

  return {
    metadataBase: new URL(tenant.seo.canonicalBase || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { template: tenant.seo.titleTemplate, default: tenant.brand.name },
    description: tenant.seo.defaultDescription,
    icons: { icon: tenant.brand.logo },
    alternates: {
      canonical: lang === "en" ? "/" : `/${lang}`,
      languages: { ...languages, "x-default": tenant.languages.default === "en" ? "/" : `/${tenant.languages.default}` },
    },
    openGraph: {
      siteName: tenant.brand.name,
      locale: lang,
      alternateLocale: ALL_LOCALES.filter((l) => l !== lang && tenant.languages.enabled.includes(l)),
    },
  };
}

/**
 * Public root layout. Every public page renders the approved design through the
 * locked templates, which carry their own styles, so this layout adds nothing
 * visual: no Tailwind, theme switching, web fonts, or React booking UI. The admin
 * console has its own root layout (src/app/admin/layout.tsx) with its own styles.
 */
export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const tenant = await getTenant();
  const dict = getDictionary(lang);

  return (
    <html lang={lang} data-atf-locked="">
      <body>
        <a href="#top" className="skip-link">
          {dict.nav.skipToContent}
        </a>
        {children}
        <AnalyticsScripts tenant={tenant} />
      </body>
    </html>
  );
}
