import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTenant } from "@/tenant/get-tenant";
import { getPagesByType } from "@/seo/registry";
import { resolvePublishedPage } from "@/seo/page-loader";
import { buildMetadata } from "@/seo/metadata";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";

export function generateStaticParams() {
  return (["en", "es"] as const).flatMap((lang) => getPagesByType("static", lang).map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  return buildMetadata(await resolvePublishedPage("static", slug, lang), await getTenant());
}

export default async function StaticSeoPage({ params }: PageProps<"/[lang]/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  return <LockedSubpage page={await resolvePublishedPage("static", slug, lang)} template="article" />;
}
