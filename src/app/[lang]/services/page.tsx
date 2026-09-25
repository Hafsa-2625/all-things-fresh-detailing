import { notFound } from "next/navigation";
import { getPagesByType } from "@/seo/registry";
import { buildPagePath } from "@/seo/metadata";
import { hubPage } from "@/seo/hub-page";
import { LockedHub } from "@/components/locked-design/locked-hub";

const page = hubPage("services", "Mobile Car Detailing Services", "Every mobile detailing, protection, and specialty service offered by All Things Fresh across Greater Cleveland.", "Detailing services, built around your vehicle.", "Choose the service that fits the vehicle today. We confirm scope and pricing before work begins, and our mobile setup comes to your home or workplace.");
export function generateMetadata() { return { title: page.title, description: page.description, alternates: { canonical: "/services" } }; }
export default async function ServicesHub({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params; if (lang !== "en") notFound();
  const items = getPagesByType("service", "en").map((item) => ({ href: buildPagePath(item), title: item.h1, description: item.description }));
  return <LockedHub page={page} items={items} />;
}
