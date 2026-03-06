const translations = {
  de: {
    tabs: {
      overview: 'Übersicht',
      offer: 'Angebot',
      references: 'Referenzen',
    },
    hero: {
      preparedFor: 'Vorbereitet für',
      date: 'Erstellt am',
      by: 'Ihr Ansprechpartner',
    },
    sections: {
      videoTitle: 'Persönliche Nachricht',
      situationTitle: 'Auf einen Blick',
      situationSubtitle: 'Ausgangslage',
      goalTitle: 'Euer Ziel',
      approachTitle: 'Unser Ansatz',
      costTitle: 'Was jeder weitere Monat ohne Lösung kostet',
      outcomeTitle: 'Ihr Ergebnis nach der Zusammenarbeit',
      processTitle: 'So arbeiten wir zusammen',
      processEffort: 'Aufwand',
      processDuration: 'Dauer',
      guaranteeTitle: 'Unser Versprechen',
      ctaDefault: 'Jetzt Angebot ansehen',
      ctaContact: 'Oder kontaktieren Sie uns direkt',
    },
    offer: {
      title: 'Ihr individuelles Angebot',
      subtitle: 'Prüfen und direkt digital unterschreiben',
      noPandadoc: 'Das Angebot wird in Kürze bereitgestellt.',
    },
    references: {
      title: 'Das sagen unsere Kunden',
      subtitle: 'Über 4.000 zufriedene Kunden vertrauen uns',
    },
    footer: {
      privacy: 'Datenschutz',
      imprint: 'Impressum',
      copyright: 'Gündesli und Kollegen GmbH',
      address: 'Vollmerhauser Straße 47, Gummersbach',
    },
    trust: {
      customers: '4.000+ Kunden',
      awards: '50+ Auszeichnungen',
      languages: '8 Sprachen',
    },
  },
  en: {
    tabs: {
      overview: 'Overview',
      offer: 'Proposal',
      references: 'References',
    },
    hero: {
      preparedFor: 'Prepared for',
      date: 'Created on',
      by: 'Your contact',
    },
    sections: {
      videoTitle: 'Personal Message',
      situationTitle: 'At a Glance',
      situationSubtitle: 'Current Situation',
      goalTitle: 'Your Goal',
      approachTitle: 'Our Approach',
      costTitle: 'What every additional month without a solution costs',
      outcomeTitle: 'Your results after working with us',
      processTitle: 'How we work together',
      processEffort: 'Effort',
      processDuration: 'Duration',
      guaranteeTitle: 'Our Promise',
      ctaDefault: 'View Proposal Now',
      ctaContact: 'Or contact us directly',
    },
    offer: {
      title: 'Your Individual Proposal',
      subtitle: 'Review and sign digitally',
      noPandadoc: 'The proposal will be available shortly.',
    },
    references: {
      title: 'What Our Clients Say',
      subtitle: 'Over 4,000 satisfied clients trust us',
    },
    footer: {
      privacy: 'Privacy Policy',
      imprint: 'Imprint',
      copyright: 'Gündesli und Kollegen GmbH',
      address: 'Vollmerhauser Straße 47, Gummersbach',
    },
    trust: {
      customers: '4,000+ Clients',
      awards: '50+ Awards',
      languages: '8 Languages',
    },
  },
} as const;

export type Language = 'de' | 'en';

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Translations = DeepStringify<typeof translations.de>;

export function t(lang: Language): Translations {
  return translations[lang];
}
