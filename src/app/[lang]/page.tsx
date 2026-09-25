import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { DcRuntime } from "@/components/locked-design/dc-runtime";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLockedHomeMarkup } from "@/lib/locked-design/home-template";
import { getDictionary } from "@/i18n/get-dictionary";
import { getTenant } from "@/tenant/get-tenant";
import { getSlotMedia } from "@/lib/content/catalog";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [tenant, media] = await Promise.all([getTenant(), getSlotMedia()]);

  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: getLockedHomeMarkup(tenant, media) }} />
      <DcRuntime />
      <SiteFooter tenant={tenant} dict={getDictionary(lang)} locale={lang} />
    </>
  );
}
