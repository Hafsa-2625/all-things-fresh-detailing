import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTenant } from "@/tenant/get-tenant";
import { getPagesByType } from "@/seo/registry";
import { resolvePublishedPage } from "@/seo/page-loader";
import { buildMetadata } from "@/seo/metadata";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";

export function generateStaticParams() {
  return (["en", "es"] as const).flatMap((lang) => getPagesByType("location", lang).map((p) => ({ lang, location: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/locations/[location]">) {
  const { lang, location } = await params;
  if (!isLocale(lang)) notFound();
  return buildMetadata(await resolvePublishedPage("location", location, lang), await getTenant());
}

export default async function LocationPage({ params }: PageProps<"/[lang]/locations/[location]">) {
  const { lang, location } = await params;
  if (!isLocale(lang)) notFound();
  return <LockedSubpage page={await resolvePublishedPage("location", location, lang)} template="location" />;
}
