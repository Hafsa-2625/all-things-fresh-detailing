/**
 * End-to-end security suite for checklist §1 (docs/PROD_READINESS_CHECKLIST.md).
 *
 * Runs against a production build connected to a *disposable* Supabase stack
 * with Mailpit (the Supabase CLI local stack). It creates users, invites,
 * and uploads, so never point it at a database holding real data.
 *
 *   npx supabase start && npx supabase db reset
 *   npm run build && npm start            # with the env below
 *   npm run qa:security
 *
 * Env: CRAWL_BASE (default http://localhost:3000), NEXT_PUBLIC_SUPABASE_URL,
 * NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, MAILPIT_URL
 * (default http://127.0.0.1:54324), ADMIN_BOOTSTRAP_EMAIL.
 * The server must run with the same ADMIN_BOOTSTRAP_EMAIL.
 */
import { chromium, type APIRequestContext, type Browser, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const BASE = (process.env.CRAWL_BASE || "http://localhost:3000").replace(/\/$/, "");
const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
const ANON_KEY = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SERVICE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
const BOOTSTRAP = required("ADMIN_BOOTSTRAP_EMAIL").toLowerCase();
const MAILPIT = (process.env.MAILPIT_URL || "http://127.0.0.1:54324").replace(/\/$/, "");
const RUN = Date.now().toString(36);
const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

const service = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const failures: string[] = [];
let passes = 0;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passes += 1;
    console.log(`PASS ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL ${name}${detail === undefined ? "" : ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}`}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const email = (label: string) => `${label}-${RUN}@atf.test`;

// ---------------------------------------------------------------------------
// Mailpit
// ---------------------------------------------------------------------------
type MailSummary = { ID: string; To: { Address: string }[]; Created: string };

async function messagesFor(address: string, since: number): Promise<MailSummary[]> {
  const response = await fetch(`${MAILPIT}/api/v1/messages?limit=200`);
  const { messages } = await response.json() as { messages: MailSummary[] };
  return messages.filter((message) => message.To.some((to) => to.Address.toLowerCase() === address) && Date.parse(message.Created) >= since - 1000);
}

async function waitForMagicLink(address: string, since: number): Promise<string | null> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const [latest] = await messagesFor(address, since);
    if (latest) {
      const detail = await (await fetch(`${MAILPIT}/api/v1/message/${latest.ID}`)).json() as { Text: string; HTML: string };
      const link = `${detail.Text}\n${detail.HTML.replaceAll("&amp;", "&")}`.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/);
      if (link) return link[0];
    }
    await sleep(500);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Browser sign-in through the real login form and magic link
// ---------------------------------------------------------------------------
async function requestLink(context: BrowserContext, address: string): Promise<string> {
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`);
  await page.fill('form input[name="email"]', address);
  await page.click('form button[value="link"]');
  // Scoped to the form: Next's route announcer is also role="alert" and is always present.
  const status = page.locator('form [role="status"], form [role="alert"]');
  await status.waitFor({ timeout: 15_000 });
  const message = (await status.textContent()) ?? "";
  await page.close();
  return message;
}

/** Returns the URL the browser lands on after following the emailed link, or null if no email arrived. */
async function signIn(context: BrowserContext, address: string): Promise<string | null> {
  const since = Date.now();
  await requestLink(context, address);
  const link = await waitForMagicLink(address, since);
  if (!link) return null;
  const page = await context.newPage();
  await page.goto(link);
  await page.waitForURL((url) => url.pathname === "/admin" || url.pathname === "/admin/login", { timeout: 20_000 });
  const landed = page.url();
  await page.close();
  return landed;
}

async function expectNoEmail(address: string, since: number): Promise<boolean> {
  await sleep(2500);
  return (await messagesFor(address, since)).length === 0;
}

async function json(request: APIRequestContext, method: "get" | "post" | "patch", path: string, data?: unknown) {
  const response = await request[method](`${BASE}${path}`, data === undefined ? undefined : { data });
  let body: Record<string, unknown> = {};
  try { body = await response.json(); } catch { /* non-JSON */ }
  return { status: response.status(), body };
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------
async function headersSuite() {
  const home = await fetch(`${BASE}/`);
  const csp = home.headers.get("content-security-policy") ?? "";
  check("public page sends CSP with frame-ancestors 'none' and object-src 'none'", csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"), csp);
  check("public page sends HSTS, nosniff, DENY framing, referrer policy", Boolean(home.headers.get("strict-transport-security")) && home.headers.get("x-content-type-options") === "nosniff" && home.headers.get("x-frame-options") === "DENY" && Boolean(home.headers.get("referrer-policy")));
  check("x-powered-by header removed", !home.headers.has("x-powered-by"));
  const login = await fetch(`${BASE}/admin/login`);
  check("admin responses are marked noindex", (login.headers.get("x-robots-tag") ?? "").includes("noindex"));
  const admin = await fetch(`${BASE}/admin`, { redirect: "manual" });
  check("anonymous /admin redirects to sign-in (rendered per request, not prerendered)", admin.status >= 300 && admin.status < 400 && (admin.headers.get("location") ?? "").includes("/admin/login"), admin.status);
}

async function databaseSuite() {
  const marker = `Private Customer ${RUN}`;
  await service.from("customers").insert({ name: marker, phone: "440-555-0100" });
  await service.from("leads").insert({ name: marker, phone: "440-555-0101" });

  const attacker = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  await attacker.auth.signUp({ email: email("selfsignup"), password: "Attacker-Password-123" });
  for (const table of ["customers", "leads", "quotes", "quote_items", "profiles", "audit_log", "staff_invites", "tenant_configs", "rate_limits"]) {
    const { data } = await attacker.from(table).select("*");
    check(`self-registered account reads nothing from ${table}`, (data ?? []).length === 0 || (table === "tenant_configs" && (data ?? []).every((row) => row.status === "published")), (data ?? []).length);
  }
  const promote = await attacker.from("profiles").update({ role: "super_admin", active: true }).eq("email", email("selfsignup")).select();
  check("self-registered account cannot promote itself", (promote.data ?? []).length === 0);
  const hit = await attacker.rpc("record_redirect_hit", { requested_tenant: "all-things-fresh", requested_path: "/x" });
  check("redirect hit counter is not callable by users", Boolean(hit.error));
  const limiter = await createClient(SUPABASE_URL, ANON_KEY).rpc("rate_limit_hit", { p_key: "x", p_window_seconds: 1, p_max: 1 });
  check("rate limiter is not callable anonymously", Boolean(limiter.error));
  const scheduled = await attacker.rpc("schedule_quote", { p_tenant_id: "all-things-fresh", p_quote_id: crypto.randomUUID(), p_starts_at: new Date().toISOString(), p_actor: null });
  check("quote scheduling is not callable by users", scheduled.error?.code === "42501", scheduled.error?.code);
  const evil = await service.from("redirects").insert({ source_path: `/db-evil-${RUN}`, destination_path: "//evil.example" });
  check("database rejects protocol-relative redirect destinations", Boolean(evil.error));
}

/** A forged-but-valid Supabase session cookie for a self-registered account must not reach admin data. */
async function forgedSessionSuite() {
  const jar = new Map<string, string>();
  const client = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const signUp = await client.auth.signUp({ email: email("cookie-attacker"), password: "Attacker-Password-123" });
  check("attacker obtained a real Supabase session (precondition)", Boolean(signUp.data.session), signUp.error?.message);
  const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
  const api = await fetch(`${BASE}/api/admin/data/customers`, { headers: { cookie } });
  check("inactive account's session gets 401 from admin data API", api.status === 401, api.status);
  const page = await fetch(`${BASE}/admin`, { headers: { cookie }, redirect: "manual" });
  check("inactive account's session is redirected away from /admin", page.status >= 300 && page.status < 400, page.status);
}

async function authSuite(browser: Browser) {
  const strangerContext = await browser.newContext();
  const since = Date.now();
  const message = await requestLink(strangerContext, email("stranger"));
  // Asserted on shape, not exact wording: the security property is that the reply is conditional
  // and reveals nothing about whether the address has access. "unknown email receives no sign-in
  // email" below carries the rest of the weight. A previous copy of this check hardcoded a phrase
  // the login rewrite had already changed, so it failed on wording alone.
  check(
    "unknown email gets the same generic response",
    message.trim().startsWith("If ") && message.includes(email("stranger")) && /magic link is on its way/i.test(message),
    message,
  );
  check("unknown email receives no sign-in email", await expectNoEmail(email("stranger"), since));

  const selfSignupSince = Date.now();
  await requestLink(strangerContext, email("selfsignup"));
  check("self-registered (inactive) account receives no sign-in email", await expectNoEmail(email("selfsignup"), selfSignupSince));
  await strangerContext.close();

  const owner = await browser.newContext();
  const landed = await signIn(owner, BOOTSTRAP);
  check("bootstrap email signs in through magic link and lands on /admin", landed !== null && new URL(landed).pathname === "/admin", landed);
  const { data: ownerProfile } = await service.from("profiles").select("role, active").eq("email", BOOTSTRAP).single();
  check("bootstrap account became an active super admin", ownerProfile?.role === "super_admin" && ownerProfile.active === true, ownerProfile);
  return owner;
}

async function staffSuite(browser: Browser, owner: BrowserContext) {
  const ownerApi = owner.request;
  const managerEmail = email("manager");
  const adminEmail = email("admin");

  // Wildcard safety: an invite for a_b@… must not admit axb@….
  check("owner can invite a manager", (await json(ownerApi, "post", "/api/admin/data/staff_invites", { email: managerEmail, role: "manager" })).status === 201);
  check("owner can invite an address containing _", (await json(ownerApi, "post", "/api/admin/data/staff_invites", { email: `a_b-${RUN}@atf.test`, role: "editor" })).status === 201);
  const lookalikeSince = Date.now();
  const lookalike = await browser.newContext();
  await requestLink(lookalike, `axb-${RUN}@atf.test`);
  await lookalike.close();
  check("look-alike address (_ wildcard) is not treated as invited", await expectNoEmail(`axb-${RUN}@atf.test`, lookalikeSince));
  check("invite email is stored lower-case", (await json(ownerApi, "post", "/api/admin/data/staff_invites", { email: `Mixed.Case-${RUN}@ATF.test`, role: "editor" })).body.row !== undefined && ((await service.from("staff_invites").select("email").eq("email", `mixed.case-${RUN}@atf.test`)).data ?? []).length === 1);

  const manager = await browser.newContext();
  const managerLanded = await signIn(manager, managerEmail);
  check("invited manager signs in", managerLanded !== null && new URL(managerLanded).pathname === "/admin", managerLanded);
  check("manager cannot invite staff", (await json(manager.request, "post", "/api/admin/data/staff_invites", { email: email("x"), role: "editor" })).status === 403);
  check("re-inviting an active member is refused", (await json(ownerApi, "post", "/api/admin/data/staff_invites", { email: managerEmail, role: "editor" })).status === 409);

  check("owner can invite an admin", (await json(ownerApi, "post", "/api/admin/data/staff_invites", { email: adminEmail, role: "admin" })).status === 201);
  const adminContext = await browser.newContext();
  await signIn(adminContext, adminEmail);
  const adminApi = adminContext.request;
  check("admin cannot grant admin", (await json(adminApi, "post", "/api/admin/data/staff_invites", { email: email("admin2"), role: "admin" })).status === 403);
  check("admin can invite an editor", (await json(adminApi, "post", "/api/admin/data/staff_invites", { email: email("editor"), role: "editor" })).status === 201);

  const roster = (await json(ownerApi, "get", "/api/admin/staff")).body.rows as { id: string; email: string; role: string }[];
  const managerRow = roster.find((row) => row.email === managerEmail)!;
  const ownerRow = roster.find((row) => row.email === BOOTSTRAP)!;
  check("self-registered accounts are not listed as staff", !roster.some((row) => row.email === email("selfsignup")), roster.map((row) => row.email));
  const { data: stranger } = await service.from("profiles").select("id").eq("email", email("selfsignup")).single();
  check("a never-invited account cannot be 'reactivated'", (await json(ownerApi, "patch", "/api/admin/staff", { id: stranger!.id, active: true })).status === 409);
  check("manager cannot change roles", (await json(manager.request, "patch", "/api/admin/staff", { id: ownerRow.id, role: "editor" })).status === 403);
  check("admin cannot change a super admin", (await json(adminApi, "patch", "/api/admin/staff", { id: ownerRow.id, role: "editor" })).status === 403);
  check("admin cannot promote to admin", (await json(adminApi, "patch", "/api/admin/staff", { id: managerRow.id, role: "admin" })).status === 403);
  check("owner cannot change their own access", (await json(ownerApi, "patch", "/api/admin/staff", { id: ownerRow.id, role: "editor" })).status === 403);
  const demoted = await json(adminApi, "patch", "/api/admin/staff", { id: managerRow.id, role: "editor" });
  check("admin can demote a manager to editor", demoted.status === 200 && (demoted.body.row as { role: string }).role === "editor", demoted);
  check("demoted editor can no longer write", (await json(manager.request, "post", "/api/admin/data/customers", { name: "Should Fail" })).status === 403);

  const deactivated = await json(adminApi, "patch", "/api/admin/staff", { id: managerRow.id, active: false });
  check("admin can deactivate an editor", deactivated.status === 200, deactivated);
  check("deactivated member's open session loses API access immediately", (await json(manager.request, "get", "/api/admin/data/leads")).status === 401);
  const deactivatedSince = Date.now();
  await requestLink(await browser.newContext(), managerEmail);
  check("deactivated member receives no sign-in email", await expectNoEmail(managerEmail, deactivatedSince));
  const { data: bannedUser } = await service.auth.admin.getUserById(managerRow.id);
  check("deactivated member is banned in Supabase Auth", Boolean(bannedUser.user?.banned_until), bannedUser.user?.banned_until);
  check("reactivation restores access", (await json(adminApi, "patch", "/api/admin/staff", { id: managerRow.id, active: true })).status === 200);

  const { data: auditRows } = await service.from("audit_log").select("action").in("action", ["staff.access_changed", "staff.invite_accepted", "staff.bootstrap_super_admin"]);
  check("access changes are audited", new Set((auditRows ?? []).map((row) => row.action)).size === 3, auditRows);
  await manager.close();
  await adminContext.close();
}

async function redirectSuite(owner: BrowserContext) {
  const api = owner.request;
  const source = `/old-page-${RUN}`;
  for (const destination of ["//evil.example", "/\\evil.example", "/ok path", source]) {
    check(`redirect to ${JSON.stringify(destination)} rejected`, (await json(api, "post", "/api/admin/data/redirects", { source_path: source, destination_path: destination })).status === 422);
  }
  check("valid redirect accepted", (await json(api, "post", "/api/admin/data/redirects", { source_path: source, destination_path: "/services", status_code: 301 })).status === 201);
  check("redirect loop rejected", (await json(api, "post", "/api/admin/data/redirects", { source_path: "/services", destination_path: source })).status === 422);
  const response = await fetch(`${BASE}${source}`, { redirect: "manual" });
  check("managed redirect is served by the proxy", response.status === 301 && new URL(response.headers.get("location") ?? "", BASE).pathname === "/services", response.status);
  let hits = 0;
  for (let attempt = 0; attempt < 10 && hits === 0; attempt += 1) {
    await sleep(300);
    hits = Number((await service.from("redirects").select("hits").eq("source_path", source).single()).data?.hits ?? 0);
  }
  check("redirect hit recorded with the server key", hits >= 1, hits);
}

async function mediaSuite(owner: BrowserContext) {
  const upload = (name: string, mimeType: string, buffer: Buffer, slotBinding = "") => owner.request.post(`${BASE}/api/admin/media`, {
    multipart: { file: { name, mimeType, buffer }, altText: "Test upload image", slotBinding },
  });
  const unknownSlot = await upload("photo.png", "image/png", PNG_1PX, "not-a-design-slot");
  check("upload to a slot the design does not have is rejected", unknownSlot.status() === 422, unknownSlot.status());
  const tooSmall = await upload("tiny.png", "image/png", PNG_1PX, "svc-interior-media");
  const tooSmallBody = await tooSmall.json() as { error?: string };
  check("undersized photo for a real slot is rejected with its size", tooSmall.status() === 422 && /1×1px/.test(tooSmallBody.error ?? ""), tooSmallBody);
  const svg = await upload("x.svg", "image/svg+xml", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'));
  check("SVG upload rejected", svg.status() === 422, svg.status());
  const disguised = await upload("x.png", "image/png", Buffer.from("<html><script>alert(1)</script></html>"));
  check("HTML disguised as PNG rejected", disguised.status() === 422, disguised.status());
  const real = await upload("photo.png", "image/png", PNG_1PX);
  const body = await real.json() as { row?: { storage_path: string; mime_type: string } };
  check("real PNG accepted", real.status() === 201 && body.row?.mime_type === "image/png", real.status());
  if (body.row) {
    const served = await fetch(body.row.storage_path);
    check("uploaded image is publicly served as image/png", served.ok && (served.headers.get("content-type") ?? "").startsWith("image/png"), served.status);
  }
  const anonymousUpload = await createClient(SUPABASE_URL, ANON_KEY).storage.from("atf-media").upload(`anon-${RUN}.png`, PNG_1PX, { contentType: "image/png" });
  check("anonymous clients cannot upload to the media bucket", Boolean(anonymousUpload.error));
  const bucket = await service.storage.getBucket("atf-media");
  check("media bucket excludes SVG", Boolean(bucket.data) && !(bucket.data?.allowed_mime_types ?? []).includes("image/svg+xml"), bucket.data?.allowed_mime_types);
}

async function leadSuite() {
  const post = (payload: unknown, ip: string) => fetch(`${BASE}/api/leads`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(payload) });
  // The public forms mark the date required and /api/leads enforces it, so every payload that is
  // meant to succeed has to carry one. Checks that expect a rejection override it below.
  const preferredDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const base = { name: "E2E Lead", phone: "440-555-0199", source: "security-e2e", preferredDate };
  check("impossible date rejected with 422", (await post({ ...base, preferredDate: "2026-02-31" }, `10.0.${RUN.length}.1`)).status === 422);
  const plain = await post({ ...base, preferredDate: "2026-10-02" }, `10.1.0.${Math.floor(Math.random() * 250)}`);
  const plainId = (await plain.json() as { leadId?: string }).leadId;
  const consented = await post({ ...base, smsConsent: "on" }, `10.2.0.${Math.floor(Math.random() * 250)}`);
  const consentedId = (await consented.json() as { leadId?: string }).leadId;
  const { data: rows } = await service.from("leads").select("id, consent_sms_transactional").in("id", [plainId, consentedId].filter(Boolean) as string[]);
  check("lead without consent stores consent=false", rows?.find((row) => row.id === plainId)?.consent_sms_transactional === false, rows);
  check("explicit consent stores consent=true", rows?.find((row) => row.id === consentedId)?.consent_sms_transactional === true, rows);

  const ip = `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const statuses: number[] = [];
  for (let index = 0; index < 9; index += 1) statuses.push((await post(base, ip)).status);
  check("9th lead from one address in a minute is rate limited", statuses.slice(0, 8).every((status) => status === 201) && statuses[8] === 429, statuses);
  const { data: limiterRow } = await service.from("rate_limits").select("hits").eq("key", `lead:${ip}`).single();
  check("rate limit state is shared in the database", Number(limiterRow?.hits) === 9, limiterRow);
}


async function browserSuite(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const violations: string[] = [];
  const thirdParty: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    // The approved homepage markup ships <iframe src="{{ videoSrc }}"> inside an sc-if that the design
    // runtime removes on boot; the browser's attempt to frame the literal placeholder is now blocked
    // instead of loading a 404. It is never visible, so it is the one expected report.
    if (/Framing '[^']*%7B%7B%20\w+%20%7D%7D'/.test(text)) return;
    if (/Content Security Policy|Refused to/i.test(text)) violations.push(text);
  });
  page.on("pageerror", (error) => violations.push(`pageerror: ${error.message}`));
  const ownHost = new URL(BASE).host;
  page.on("request", (request) => { const host = new URL(request.url()).host; if (host && host !== ownHost) thirdParty.push(host); });

  for (const path of ["/", "/services/ceramic-coating", "/service-area/lakewood-oh", "/resources/winter-car-care", "/es", "/admin/login"]) {
    const before = violations.length;
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    check(`no CSP violations or script errors on ${path}`, violations.length === before, violations.slice(before));
  }
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const renderedForms = await page.locator("form").count();
  check("design runtime rendered the homepage forms under CSP", renderedForms >= 1, renderedForms);
  const lead = await page.evaluate(async () => (await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.77.0.1" }, body: JSON.stringify({ name: "Browser Lead", phone: "440-555-0142", source: "security-e2e-browser", preferredDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) }) })).status);
  check("same-origin lead submission allowed by CSP", lead === 201, lead);
  check("no requests to unpkg (runtime uses bundled React)", !thirdParty.some((host) => host.includes("unpkg")), [...new Set(thirdParty)]);
  await context.close();
}

async function main() {
  // Local runs default to installed Chrome; CI sets PLAYWRIGHT_CHANNEL=chromium for Playwright's bundled build.
  const channel = process.env.PLAYWRIGHT_CHANNEL || "chrome";
  const browser = await chromium.launch({ channel: channel === "chromium" ? undefined : channel, headless: true });
  await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });
  try {
    await headersSuite();
    await databaseSuite();
    await forgedSessionSuite();
    const owner = await authSuite(browser);
    await staffSuite(browser, owner);
    await redirectSuite(owner);
    await mediaSuite(owner);
    await leadSuite();
    await browserSuite(browser);
  } finally {
    await browser.close();
  }
  console.log(`\n${passes} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const failure of failures) console.log(`  ✗ ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
