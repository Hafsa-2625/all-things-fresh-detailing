export {};

const BASE = (process.env.CRAWL_BASE || "http://localhost:3000").replace(/\/$/, "");

async function expect(path: string, init: RequestInit, status: number, label: string) {
  const response = await fetch(`${BASE}${path}`, init);
  if (response.status !== status) throw new Error(`${label}: expected ${status}, received ${response.status}: ${await response.text()}`);
  console.log(`PASS ${label}`);
  return response;
}

async function main() {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await expect("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Missing Phone" }) }, 422, "invalid lead rejected");
  // Both public forms mark the date required; the route enforces it so a direct POST can't skip it.
  await expect("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "No Date", phone: "440-555-0198", source: "automated-smoke-test" }) }, 422, "lead without a preferred date rejected");
  await expect("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Impossible Date", phone: "440-555-0197", preferredDate: "2026-02-31", source: "automated-smoke-test" }) }, 422, "lead with an impossible date rejected");
  const lead = await expect("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "QA Website Lead", phone: "440-555-0199", service: "Full Maintenance", preferredDate: tomorrow, source: "automated-smoke-test" }) }, 201, "valid lead stored");
  const leadPayload = await lead.json() as { leadId?: string };
  if (!leadPayload.leadId) throw new Error("valid lead response did not include leadId");
  await expect("/api/admin/data/leads", { method: "GET" }, 401, "admin data requires authentication");
  await expect("/api/admin/media", { method: "POST" }, 401, "media upload requires authentication");
  console.log("All API and security smoke checks passed.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
