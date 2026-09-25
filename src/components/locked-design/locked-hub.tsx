import type { SeoPage } from "@/seo/types";
import { getLockedHubMarkup, type LockedHubItem } from "@/lib/locked-design/subpage-template";
import { DcRuntime } from "./dc-runtime";
import { getTenant } from "@/tenant/get-tenant";

export async function LockedHub({ page, items }: { page: SeoPage; items: LockedHubItem[] }) {
  const tenant = await getTenant();
  return <><div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: getLockedHubMarkup(page, items, tenant) }} /><DcRuntime /></>;
}
