import type { SeoPage } from "../types";
import { STATIC_ROUTE_SLUGS } from "@/i18n/routes";

const published = (overrides: Omit<SeoPage, "type" | "status" | "schema">): SeoPage => ({
  type: "static",
  status: "published",
  schema: ["BreadcrumbList"],
  ...overrides,
});

/**
 * Published (not draft) on purpose, even though the content itself is a
 * placeholder: an internal link that 404s is worse than a page that's
 * honest about being unfinished — the SEO quality gate itself flags broken
 * internal links as an error, and the footer always links here. Marked
 * noindex via robots so it doesn't rank while it's still a placeholder.
 */
const placeholderLegal = (overrides: Omit<SeoPage, "type" | "status" | "schema">): SeoPage => ({
  type: "static",
  status: "published",
  schema: ["BreadcrumbList"],
  ...overrides,
});

export const staticPages: SeoPage[] = [
  published({
    locale: "en", slug: STATIC_ROUTE_SLUGS.about.en, pageKey: "about", clusterId: "mobile-detailing", primaryKeyword: "about all things fresh",
    secondaryKeywords: [], intent: ["navigational"],
    title: "About Us", description: "Mobile car detailing across Greater Cleveland, OH — background-checked detailers, real care for every vehicle.",
    h1: "About All Things Fresh",
    intro: "Get service at our shop or at home with our mobile detailing service. Every detailer is background-checked, friendly, and reliable — we connect to your water and electricity, or bring our own upon request.",
    sections: [], relatedSlugs: [{ type: "service", slug: "full-maintenance" }],
  }),
  published({
    locale: "en", slug: STATIC_ROUTE_SLUGS.contact.en, pageKey: "contact", clusterId: "mobile-detailing", primaryKeyword: "contact all things fresh",
    secondaryKeywords: [], intent: ["navigational", "transactional"],
    title: "Contact", description: "Book, ask a question, or get a quote — call, text, or book online.",
    h1: "Contact Us",
    intro: "The fastest way to get on the schedule is to book directly. For questions or a quote, call or text — we respond quickly.",
    sections: [], relatedSlugs: [],
  }),
  published({
    locale: "en", slug: STATIC_ROUTE_SLUGS["gift-cards"].en, pageKey: "gift-cards", clusterId: "gift-cards", primaryKeyword: "car detailing gift card",
    secondaryKeywords: ["detailing gift certificate"], intent: ["transactional"],
    title: "Gift Cards", description: "Give a detail — gift cards for any package, redeemable whenever the recipient is ready to book.",
    h1: "Gift Cards",
    intro: "A detailing gift card is a well-received gift for anyone who cares about their car. Choose an amount or a specific package, and the recipient books whenever it fits their schedule.",
    sections: [], relatedSlugs: [{ type: "guide", slug: "gift-a-detail-guide" }],
  }),
  placeholderLegal({
    locale: "en", slug: STATIC_ROUTE_SLUGS.terms.en, pageKey: "terms", clusterId: "mobile-detailing", primaryKeyword: "terms and conditions", secondaryKeywords: [], intent: ["navigational"],
    forceNoindex: true,
    title: "Terms & Conditions", description: "Placeholder terms and conditions — final legal copy will be added before launch.",
    h1: "Terms & Conditions",
    intro: "This page is a placeholder. All Things Fresh's actual terms and conditions will be added here before the site goes live — this text is not a binding agreement.",
    sections: [], relatedSlugs: [],
  }),
  placeholderLegal({
    locale: "en", slug: STATIC_ROUTE_SLUGS.privacy.en, pageKey: "privacy", clusterId: "mobile-detailing", primaryKeyword: "privacy policy", secondaryKeywords: [], intent: ["navigational"],
    forceNoindex: true,
    title: "Privacy Policy", description: "Placeholder privacy policy — final legal copy will be added before launch.",
    h1: "Privacy Policy",
    intro: "This page is a placeholder. All Things Fresh's actual privacy policy will be added here before the site goes live — this text does not describe real data practices yet.",
    sections: [], relatedSlugs: [],
  }),
  published({
    locale: "es", slug: STATIC_ROUTE_SLUGS.about.es, pageKey: "about", clusterId: "mobile-detailing", primaryKeyword: "sobre all things fresh",
    secondaryKeywords: [], intent: ["navigational"],
    title: "Nosotros", description: "Detailing móvil de autos en el área de Cleveland, OH — detailers verificados, cuidado real para cada vehículo.",
    h1: "Sobre All Things Fresh",
    intro: "Recibe el servicio en nuestro taller o en tu casa con nuestro detailing móvil. Cada detailer pasa verificación de antecedentes, es amable y confiable.",
    sections: [], relatedSlugs: [{ type: "service", slug: "mantenimiento-completo" }],
  }),
  published({
    locale: "es", slug: STATIC_ROUTE_SLUGS.contact.es, pageKey: "contact", clusterId: "mobile-detailing", primaryKeyword: "contactar all things fresh",
    secondaryKeywords: [], intent: ["navigational", "transactional"],
    title: "Contacto", description: "Reserva, pregunta o solicita una cotización — llama, envía un mensaje o reserva en línea.",
    h1: "Contacto",
    intro: "La forma más rápida de reservar es hacerlo directamente en línea. Para preguntas o cotizaciones, llámanos o envíanos un mensaje.",
    sections: [], relatedSlugs: [],
  }),
  published({
    locale: "es", slug: STATIC_ROUTE_SLUGS["gift-cards"].es, pageKey: "gift-cards", clusterId: "gift-cards", primaryKeyword: "tarjeta de regalo para detailing de auto",
    secondaryKeywords: [], intent: ["transactional"],
    title: "Tarjetas de Regalo", description: "Regala un detailing — tarjetas de regalo para cualquier paquete, canjeables cuando el destinatario esté listo para reservar.",
    h1: "Tarjetas de Regalo",
    intro: "Una tarjeta de regalo de detailing es un obsequio muy bien recibido para quien cuida su auto. Elige un monto o un paquete específico, y quien la recibe reserva cuando le convenga.",
    sections: [], relatedSlugs: [],
  }),
  placeholderLegal({
    locale: "es", slug: STATIC_ROUTE_SLUGS.terms.es, pageKey: "terms", clusterId: "mobile-detailing", primaryKeyword: "términos y condiciones", secondaryKeywords: [], intent: ["navigational"],
    forceNoindex: true,
    title: "Términos y Condiciones", description: "Términos y condiciones de marcador de posición — el texto legal final se agregará antes del lanzamiento.",
    h1: "Términos y Condiciones",
    intro: "Esta página es un marcador de posición. Los términos y condiciones reales de All Things Fresh se agregarán aquí antes del lanzamiento del sitio.",
    sections: [], relatedSlugs: [],
  }),
  placeholderLegal({
    locale: "es", slug: STATIC_ROUTE_SLUGS.privacy.es, pageKey: "privacy", clusterId: "mobile-detailing", primaryKeyword: "política de privacidad", secondaryKeywords: [], intent: ["navigational"],
    forceNoindex: true,
    title: "Política de Privacidad", description: "Política de privacidad de marcador de posición — el texto legal final se agregará antes del lanzamiento.",
    h1: "Política de Privacidad",
    intro: "Esta página es un marcador de posición. La política de privacidad real de All Things Fresh se agregará aquí antes del lanzamiento del sitio.",
    sections: [], relatedSlugs: [],
  }),
];
