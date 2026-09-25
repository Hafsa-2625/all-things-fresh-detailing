import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTenant } from "@/tenant/get-tenant";
import { getPagesByType } from "@/seo/registry";
import { resolvePublishedPage } from "@/seo/page-loader";
import { buildMetadata } from "@/seo/metadata";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";

export function generateStaticParams() {
  return (["en", "es"] as const).flatMap((lang) => getPagesByType("guide", lang).map((p) => ({ lang, guide: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/guides/[guide]">) {
  const { lang, guide } = await params;
  if (!isLocale(lang)) notFound();
  return buildMetadata(await resolvePublishedPage("guide", guide, lang), await getTenant());
}

export default async function GuidePage({ params }: PageProps<"/[lang]/guides/[guide]">) {
  const { lang, guide } = await params;
  if (!isLocale(lang)) notFound();
  return <LockedSubpage page={await resolvePublishedPage("guide", guide, lang)} template="article" />;
}
