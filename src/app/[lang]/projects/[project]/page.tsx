import { notFound } from "next/navigation";
import { getTenant } from "@/tenant/get-tenant";
import { buildMetadata } from "@/seo/metadata";
import { LockedSubpage } from "@/components/locked-design/locked-subpage";
import { caseStudyPage, findCaseStudy } from "@/lib/content/case-studies";

/** Case studies come only from published admin records that fill every slot of the case-study template. */
async function load(lang: string, project: string) {
  if (lang !== "en") notFound();
  const study = await findCaseStudy(project);
  if (!study) notFound();
  return study;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projects/[project]">) {
  const { lang, project } = await params;
  return buildMetadata(caseStudyPage(await load(lang, project)), await getTenant());
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/projects/[project]">) {
  const { lang, project } = await params;
  const study = await load(lang, project);
  return <LockedSubpage page={caseStudyPage(study)} template="case" caseStudy={study} />;
}
