// Client-safe types + defaults + pure merge function.
// Server-only `getGlobalContent` lives in `./global-content.ts` and imports from here.

export interface GlobalContent {
  about?: {
    kicker?: string;
    headline?: string;
    subheadline?: string;
    bullets?: Array<{ title: string; detail: string }>;
    imageUrl?: string;
  };
  steps?: {
    kicker?: string;
    headline?: string;
    items?: Array<{ step: string; title: string; description: string }>;
  };
  finalCta?: {
    title?: string;
    subtitle?: string;
    buttonLabel?: string;
  };
  socialProof?: {
    customersLabel?: string;
  };
}

type DeepRequiredGC = {
  about: { kicker: string; headline: string; subheadline: string; bullets: Array<{ title: string; detail: string }>; imageUrl: string };
  steps: { kicker: string; headline: string; items: Array<{ step: string; title: string; description: string }> };
  finalCta: { title: string; subtitle: string; buttonLabel: string };
  socialProof: { customersLabel: string };
};

export type ResolvedGlobalContent = DeepRequiredGC;

export const DEFAULT_GLOBAL_CONTENT: DeepRequiredGC = {
  about: {
    kicker: 'Über uns',
    headline: 'Solarheld — Ihr Partner für saubere Energie.',
    subheadline:
      'Seit 25 Jahren installieren wir Solaranlagen in ganz Deutschland. Von der ersten Beratung bis zur Inbetriebnahme aus einer Hand.',
    bullets: [
      {
        title: '4.000+ zufriedene Kunden',
        detail: 'Familien und Unternehmen vertrauen auf unsere Erfahrung.',
      },
      {
        title: 'Alles aus einer Hand',
        detail: 'Planung, Installation, Wartung. Keine Subunternehmer.',
      },
      {
        title: '25 Jahre Garantie',
        detail: 'Premium-Komponenten, geprüfte Qualität, langfristige Sicherheit.',
      },
    ],
    imageUrl: '/images/team/team-lg.jpeg',
  },
  steps: {
    kicker: 'In drei Schritten',
    headline: "So einfach geht's",
    items: [
      {
        step: 'Schritt 1',
        title: 'Video anschauen',
        description:
          'Ihr Ansprechpartner erklärt persönlich, worum es geht und warum dieses Angebot zu Ihrer Situation passt.',
      },
      {
        step: 'Schritt 2',
        title: 'Angebot durchlesen',
        description:
          'Prüfen Sie unser Angebot in Ruhe. Alles transparent und auf Sie zugeschnitten.',
      },
      {
        step: 'Schritt 3',
        title: 'Unterschreiben & starten',
        description:
          'Passt alles? Unterschreiben Sie digital und wir legen direkt los. Kein Papierkram, kein Warten.',
      },
    ],
  },
  finalCta: {
    title: 'Bereit für den nächsten Schritt?',
    subtitle:
      'Schauen Sie sich das vollständige Angebot an. Alle Details, transparent kalkuliert.',
    buttonLabel: 'Jetzt Angebot ansehen',
  },
  socialProof: {
    customersLabel: '4.500+ zufriedene Kunden',
  },
};

export function mergeWithDefaults(stored: GlobalContent): DeepRequiredGC {
  return {
    about: { ...DEFAULT_GLOBAL_CONTENT.about, ...(stored.about || {}) },
    steps: {
      ...DEFAULT_GLOBAL_CONTENT.steps,
      ...(stored.steps || {}),
      items: stored.steps?.items?.length
        ? stored.steps.items
        : DEFAULT_GLOBAL_CONTENT.steps.items,
    },
    finalCta: { ...DEFAULT_GLOBAL_CONTENT.finalCta, ...(stored.finalCta || {}) },
    socialProof: { ...DEFAULT_GLOBAL_CONTENT.socialProof, ...(stored.socialProof || {}) },
  };
}
