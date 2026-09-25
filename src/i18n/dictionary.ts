export interface Dictionary {
  nav: {
    services: string;
    ourWork: string;
    reviews: string;
    craftsmanship: string;
    bookNow: string;
    openMenu: string;
    closeMenu: string;
    skipToContent: string;
  };
  theme: {
    light: string;
    dark: string;
    system: string;
    toggleLabel: string;
  };
  language: {
    label: string;
  };
  /** Shared labels used across several sections/pages. Kept in the dictionary
   * rather than inline `locale === "es" ? … : …` ternaries so adding a third
   * language is a new dictionary file, not a hunt through components. */
  common: {
    guides: string;
    faq: string;
    giftCards: string;
    whatsIncluded: string;
    frequentlyAskedQuestions: string;
    relatedServices: string;
    beforeAfter: string;
    bookPrefix: string;
  };
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    subhead: string;
    ctaBook: string;
    ctaWork: string;
  };
  trust: {
    stats: {
      vehiclesPerMonth: string;
      happyCustomers: string;
      openDays: string;
      satisfaction: string;
    };
  };
  services: {
    eyebrow: string;
    heading: string;
    viewAll: string;
    startingAt: string;
    requestQuote: string;
  };
  beforeAfter: {
    eyebrow: string;
    heading: string;
    instructions: string;
    before: string;
    after: string;
  };
  film: {
    heading: string;
    body: string;
    cta: string;
  };
  portfolio: {
    eyebrow: string;
    heading: string;
    viewAll: string;
    emptyState: string;
  };
  social: {
    heading: string;
    followCta: string;
    emptyState: string;
  };
  reviews: {
    eyebrow: string;
    heading: string;
    emptyState: string;
    sampleBadge: string;
    sampleBanner: string;
  };
  bookingStrip: {
    eyebrow: string;
    heading: string;
    steps: {
      service: string;
      vehicle: string;
      pkg: string;
      addons: string;
      dateTime: string;
      details: string;
      payment: string;
      confirm: string;
    };
    cta: string;
  };
  craftsmanship: {
    eyebrow: string;
    heading: string;
    body: string;
    cta: string;
  };
  finalCta: {
    eyebrow: string;
    heading: string;
    body: string;
    ctaBook: string;
  };
  footer: {
    tagline: string;
    locationsHeading: string;
    siteLinksHeading: string;
    companyHeading: string;
    contactUs: string;
    callUs: string;
    terms: string;
    privacy: string;
    rights: string;
    builtForDuplication: string;
  };
  booking: {
    openingNewTab: string;
    notConfigured: string;
  };
  configurator: {
    title: string;
    back: string;
    next: string;
    submit: string;
    submitting: string;
    submitError: string;
    edit: string;
    close: string;
    stepOf: string; // e.g. "Step {current} of {total}" — {current}/{total} replaced at render time
    service: { heading: string; helper: string };
    vehicleType: {
      heading: string;
      sedan: string;
      suv: string;
      truck: string;
      van: string;
      luxury: string;
      boat: string;
    };
    addOns: { heading: string; helper: string; noneSelected: string };
    details: {
      heading: string;
      vehicleLabel: string;
      vehiclePlaceholder: string;
      notesLabel: string;
      notesPlaceholder: string;
    };
    dateTime: {
      heading: string;
      dateLabel: string;
      timeLabel: string;
      morning: string;
      afternoon: string;
      evening: string;
    };
    contact: {
      heading: string;
      nameLabel: string;
      emailLabel: string;
      phoneLabel: string;
      contactMethodLabel: string;
      contactPhone: string;
      contactEmail: string;
      contactText: string;
    };
    review: {
      heading: string;
      service: string;
      vehicleType: string;
      addOns: string;
      vehicle: string;
      notes: string;
      dateTime: string;
      contact: string;
      none: string;
    };
    validation: {
      required: string;
      emailInvalid: string;
    };
    previewBanner: string;
    successConfiguredTitle: string;
    successConfiguredBody: string;
    successPreviewTitle: string;
    successPreviewBody: string;
    reference: string;
    startOver: string;
  };
}
