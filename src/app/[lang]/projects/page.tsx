import { notFound } from "next/navigation";
import { hubPage } from "@/seo/hub-page";
import { LockedHub } from "@/components/locked-design/locked-hub";
import { listCaseStudies } from "@/lib/content/case-studies";

const page = hubPage("our-work", "Our Detailing Work", "Before-and-after detailing work completed by All Things Fresh across Greater Cleveland.", "Real vehicles. Real before and after.", "Case studies publish only after the actual job photos, service notes, location, time on site, and customer approval are recorded. Nothing here is invented to fill a page.");

export async function generateMetadata() {
  // Stays out of search results until there is at least one real case study to list.
  const hasStudies = (await listCaseStudies()).length > 0;
  return { title: page.title, description: page.description, alternates: { canonical: "/our-work" }, robots: { index: hasStudies, follow: true } };
}

export default async function ProjectsHub({ params }: PageProps<"/[lang]/projects">) {
  const { lang } = await params; if (lang !== "en") notFound();
  const studies = await listCaseStudies();
  const items = studies.length
    ? studies.map((study) => ({ href: `/our-work/${study.slug}`, title: study.title, description: `${study.vehicle} · ${study.service} · ${study.city}` }))
    : [{ href: "/#work", title: "See recent transformations", description: "Browse the approved before-and-after and social work already shown on the homepage while full case studies are documented." }];
  return <LockedHub page={page} items={items} />;
}
