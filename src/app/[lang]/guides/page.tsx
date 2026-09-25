import { notFound } from "next/navigation";
import { getPagesByType } from "@/seo/registry";
import { buildPagePath } from "@/seo/metadata";
import { hubPage } from "@/seo/hub-page";
import { LockedHub } from "@/components/locked-design/locked-hub";

const page = hubPage("resources", "Car Care Resources", "Clear, practical guides for detailing, ceramic coating, winter car care, interiors, paint, and vehicle maintenance.", "Straight answers for a cleaner, better-protected car.", "These resources explain what professional detailing can solve, what it cannot, how Northeast Ohio seasons affect a vehicle, and how to choose the right service without paying for work you do not need.");
export function generateMetadata() { return { title: page.title, description: page.description, alternates: { canonical: "/resources" } }; }
export default async function GuidesHub({ params }: PageProps<"/[lang]/guides">) {
  const { lang } = await params; if (lang !== "en") notFound();
  const items = getPagesByType("guide", "en").map((item) => ({ href: buildPagePath(item), title: item.h1, description: item.description }));
  return <LockedHub page={page} items={items} />;
}
