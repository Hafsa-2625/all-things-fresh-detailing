import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTenant } from "@/tenant/get-tenant";
import { getPagesByType } from "@/seo/registry";
import { resolvePublishedPage } from "@/seo/page-loader";
import { buildMetadata } from "@/seo/metadata";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";

export function generateStaticParams() {
  return (["en", "es"] as const).flatMap((lang) => getPagesByType("service", lang).map((p) => ({ lang, service: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/services/[service]">) {
  const { lang, service } = await params;
  if (!isLocale(lang)) notFound();
  return buildMetadata(await resolvePublishedPage("service", service, lang), await getTenant());
}

export default async function ServiceDetailPage({ params }: PageProps<"/[lang]/services/[service]">) {
  const { lang, service } = await params;
  if (!isLocale(lang)) notFound();
  return <LockedSubpage page={await resolvePublishedPage("service", service, lang)} template="service" />;
}
