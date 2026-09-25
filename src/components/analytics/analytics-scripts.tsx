import Script from "next/script";
import type { TenantConfig } from "@/tenant/schema";

/**
 * Loads only what's actually configured — most new tenants will have none
 * of these set, and this renders nothing at all in that case (not even an
 * empty script tag). `afterInteractive` so analytics never competes with
 * the page's own JS for the initial paint (Section 65's third-party
 * performance rule extends to analytics scripts, not just social embeds).
 */
export function AnalyticsScripts({ tenant }: { tenant: TenantConfig }) {
  return (
    <>
      {tenant.analytics.ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${tenant.analytics.ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${tenant.analytics.ga4Id}');`}
          </Script>
        </>
      )}

      {tenant.analytics.gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${tenant.analytics.gtmId}');`}
        </Script>
      )}

      {tenant.analytics.metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${tenant.analytics.metaPixelId}');
            fbq('track', 'PageView');`}
        </Script>
      )}
    </>
  );
}
