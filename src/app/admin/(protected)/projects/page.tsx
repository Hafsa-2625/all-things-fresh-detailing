import { ResourceManager } from "@/components/admin/resource-manager";
import { CASE_STUDY_COLUMNS, CASE_STUDY_DESCRIPTION, CASE_STUDY_STATUSES, caseStudyFields } from "@/components/admin/case-study-fields";
import { canWrite, requireStaff } from "@/lib/admin/session";
import { listRecords } from "@/lib/operations/store";

export default async function AdminProjectsPage() {
  const profile = await requireStaff();
  const [rows, media] = await Promise.all([listRecords("case_studies"), listRecords("media_assets")]);
  return <div className="max-w-[1280px]">
    <ResourceManager resource="case_studies" title="Case studies" description={CASE_STUDY_DESCRIPTION} initialRows={rows} columns={CASE_STUDY_COLUMNS} canEdit={canWrite(profile.role)} statusField="status" statusOptions={CASE_STUDY_STATUSES} fields={caseStudyFields(media)} />
  </div>;
}
