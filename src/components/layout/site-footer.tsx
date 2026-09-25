import Link from "next/link";
import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/tenant/schema";
import { TrackedTelLink } from "@/components/analytics/tracked-tel-link";
import { staticPath, hasLocationPage } from "@/i18n/routes";

const MAPS_URL = "https://www.google.com/maps/search/All+Things+Fresh+Auto+Detailing+Cleveland+OH";

function publicPath(locale: Locale, path: string): string {
  return locale === "en" ? path : `/${locale}${path}`;
}

function citySlug(city: string): string {
  return city.split(",")[0].toLowerCase().replace(/\s+/g, "-");
}

export function SiteFooter({ tenant, dict, locale }: { tenant: TenantConfig; dict: Dictionary; locale: Locale }) {
  const telHref = `tel:${tenant.business.phone.replace(/[^0-9+]/g, "")}`;
  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const instagram = tenant.social.instagram.url || "https://www.instagram.com/atfcardetailing";
  const tiktok = tenant.social.tiktok.url || "https://www.tiktok.com/@atfcardetailing1";

  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link href={homeHref} className="site-footer__logo">
            <img src="/assets/atf-logo-transparent.webp" alt={tenant.brand.name} width={150} height={48} />
          </Link>
          <p className="site-footer__tagline">
            {dict.footer.tagline} {tenant.business.serviceArea}. {tenant.business.hours}.
          </p>
        </div>

        {tenant.business.serviceCities.length > 0 ? (
          <div>
            <p className="site-footer__heading">{dict.footer.locationsHeading}</p>
            <ul className="site-footer__list">
              {tenant.business.serviceCities.map((city) => {
                const slug = citySlug(city);
                return (
                  <li key={city}>
                    {hasLocationPage(slug, locale) ? (
                      <Link href={publicPath(locale, `/service-area/${slug}-oh`)}>{city}</Link>
                    ) : (
                      <span>{city}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="site-footer__heading">{dict.footer.siteLinksHeading}</p>
          <ul className="site-footer__list">
            <li><Link href={publicPath(locale, "/services")}>{dict.nav.services}</Link></li>
            <li><Link href={publicPath(locale, "/our-work")}>{dict.nav.ourWork}</Link></li>
            <li><Link href={publicPath(locale, "/resources")}>{dict.common.guides}</Link></li>
            <li><Link href={publicPath(locale, "/faq")}>{dict.common.faq}</Link></li>
            <li><Link href={publicPath(locale, "/reviews")}>{dict.nav.reviews}</Link></li>
            <li><Link href={staticPath("about", locale)}>{dict.nav.craftsmanship}</Link></li>
          </ul>
        </div>

        <div>
          <p className="site-footer__heading">{dict.footer.companyHeading}</p>
          <ul className="site-footer__list">
            <li>
              <TrackedTelLink href={telHref}>
                {dict.footer.callUs} — {tenant.business.phone}
              </TrackedTelLink>
            </li>
            <li><Link href={staticPath("contact", locale)}>{dict.footer.contactUs}</Link></li>
            <li><Link href={staticPath("gift-cards", locale)}>{dict.common.giftCards}</Link></li>
            <li><Link href={staticPath("terms", locale)}>{dict.footer.terms}</Link></li>
            <li><Link href={staticPath("privacy", locale)}>{dict.footer.privacy}</Link></li>
            {tenant.social.instagram.enabled ? (
              <li><a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            ) : null}
            {tenant.social.tiktok.enabled ? (
              <li><a href={tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} {tenant.business.legalName ?? tenant.brand.name}. {dict.footer.rights}</span>
        <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">Google reviews</a>
      </div>
    </footer>
  );
}
