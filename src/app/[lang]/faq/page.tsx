import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTenant } from "@/tenant/get-tenant";
import { loadPublishedPage } from "@/seo/page-loader";
import { buildMetadata } from "@/seo/metadata";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";
import { loadPublicPage } from "@/lib/content/public-page";
function slugFor(lang:"en"|"es"){return lang==="es"?"preguntas-frecuentes":"faq";}
export async function generateMetadata({params}:PageProps<"/[lang]/faq">){const {lang}=await params;if(!isLocale(lang))notFound();return buildMetadata(await loadPublicPage(loadPublishedPage("faq",slugFor(lang),lang)),await getTenant());}
export default async function FaqPage({params}:PageProps<"/[lang]/faq">){const {lang}=await params;if(!isLocale(lang))notFound();return <LockedSubpage page={await loadPublicPage(loadPublishedPage("faq",slugFor(lang),lang))} template="article"/>;}
