import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getTenantLocaleConfig } from "@/tenant/locale-config";
import { isLocale } from "@/i18n/locales";
import { isSafeInternalPath } from "@/lib/security/paths";

const LOCALE_COOKIE = "NEXT_LOCALE";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "all-things-fresh";
const REDIRECT_CACHE_MS = 60_000;
const REDIRECT_CACHE_LIMIT = 1_000;

type ManagedRedirect = { destination_path: string; status_code: 301 | 302 | 307 | 308 };

// fetch() caching options are ignored inside Proxy, so lookups are cached here.
// Without it every public page view waits on a database round trip.
const redirectCache = new Map<string, { value: ManagedRedirect | null; expiresAt: number }>();

async function findManagedRedirect(pathname: string): Promise<ManagedRedirect | null> {
  const cached = redirectCache.get(pathname);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  const query = new URL("/rest/v1/redirects", base);
  query.searchParams.set("tenant_id", `eq.${TENANT_ID}`);
  query.searchParams.set("source_path", `eq.${pathname}`);
  query.searchParams.set("active", "eq.true");
  query.searchParams.set("select", "destination_path,status_code");
  query.searchParams.set("limit", "1");

  let value: ManagedRedirect | null;
  try {
    const response = await fetch(query, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(900),
    });
    if (!response.ok) return null;
    const rows = await response.json() as ManagedRedirect[];
    value = rows[0] ?? null;
  } catch {
    return null;
  }
  if (redirectCache.size >= REDIRECT_CACHE_LIMIT) redirectCache.clear();
  redirectCache.set(pathname, { value, expiresAt: Date.now() + REDIRECT_CACHE_MS });
  return value;
}

async function recordRedirectHit(pathname: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return;
  try {
    await fetch(new URL("/rest/v1/rpc/record_redirect_hit", base), {
      method: "POST",
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ requested_tenant: TENANT_ID, requested_path: pathname }),
      signal: AbortSignal.timeout(900),
    });
  } catch { /* Redirect delivery must never wait on analytics. */ }
}

/** Refreshes the Supabase auth session cookies on admin requests so staff are not signed out early. */
async function refreshAdminSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers?: Record<string, string>) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers ?? {})) response.headers.set(name, value);
      },
    },
  });
  try {
    await supabase.auth.getUser();
  } catch { /* The page's own access check still runs and redirects to sign-in. */ }
  return response;
}

function negotiateLocale(request: NextRequest): string {
  const tenant = getTenantLocaleConfig();
  const enabled = tenant.enabled;

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && enabled.includes(cookieLocale as (typeof enabled)[number])) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const pref of preferred) {
    const short = pref.split("-")[0];
    if (enabled.includes(short as (typeof enabled)[number])) {
      return short;
    }
  }

  return tenant.default;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // The admin panel is a separate, non-localized app (its own root layout —
  // see src/app/admin/layout.tsx) and must never get an /en or /es prefix.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return refreshAdminSession(request);
  }

  const managedRedirect = await findManagedRedirect(pathname);
  // Rows are validated on write; checked again here so a bad row can never become an open redirect.
  if (managedRedirect && managedRedirect.destination_path !== pathname && isSafeInternalPath(managedRedirect.destination_path)) {
    event.waitUntil(recordRedirectHit(pathname));
    return NextResponse.redirect(new URL(managedRedirect.destination_path, request.url), managedRedirect.status_code);
  }

  const requestedLocale = pathname.split("/")[1] ?? "";
  const hasLocale = isLocale(requestedLocale);
  const locale = hasLocale ? requestedLocale : negotiateLocale(request);
  const publicPath = hasLocale ? pathname.slice(`/${locale}`.length) || "/" : pathname;
  const url = request.nextUrl.clone();
  let internalPath = publicPath;
  if (publicPath === "/resources" || publicPath.startsWith("/resources/")) {
    internalPath = publicPath.replace(/^\/resources/, "/guides");
  } else if (publicPath === "/our-work" || publicPath.startsWith("/our-work/")) {
    internalPath = publicPath.replace(/^\/our-work/, "/projects");
  } else if (publicPath === "/service-area") {
    internalPath = "/locations";
  } else if (publicPath.startsWith("/service-area/")) {
    internalPath = publicPath.replace(/^\/service-area\//, "/locations/").replace(/-oh(?=\/|$)/, "");
  }
  if (hasLocale && internalPath === publicPath) return NextResponse.next();
  url.pathname = `/${locale}${internalPath === "/" ? "" : internalPath}`;

  // Preserve the clean canonical URL while rendering the locale-aware route.
  const response = NextResponse.rewrite(url);
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
