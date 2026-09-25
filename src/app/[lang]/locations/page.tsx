import { notFound } from "next/navigation";
import { getPagesByType } from "@/seo/registry";
import { buildPagePath } from "@/seo/metadata";
import { hubPage } from "@/seo/hub-page";
import { LockedHub } from "@/components/locked-design/locked-hub";

const page = hubPage("service-area", "Mobile Detailing Service Areas", "Mobile car detailing service areas across Greater Cleveland and Northeast Ohio.", "Mobile detailing across Greater Cleveland.", "All Things Fresh brings professional detailing equipment to homes, workplaces, street-side parking, and approved lots across our core Northeast Ohio service area.");
export function generateMetadata() { return { title: page.title, description: page.description, alternates: { canonical: "/service-area" } }; }
export default async function LocationsHub({ params }: PageProps<"/[lang]/locations">) {
  const { lang } = await params; if (lang !== "en") notFound();
  const items = getPagesByType("location", "en").map((item) => ({ href: buildPagePath(item), title: item.h1.replace("Mobile Car Detailing in ", ""), description: item.description }));
  return <LockedHub page={page} items={items} />;
}
