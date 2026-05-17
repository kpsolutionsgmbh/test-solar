import Anthropic from '@anthropic-ai/sdk';
import { DealroomContent } from '@/types/database';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ============================================================
// Shared brand + writing-rules prefix (~1600 tokens DE / ~1400 EN).
// Marked with cache_control so Anthropic caches it for 5 min.
// First generation: cold. Subsequent generations within 5 min: cache hit,
// saves ~3-5s of input processing + 90% input-token cost on the prefix.
// ============================================================
const SHARED_DE = `Du bist ein Conversion-Copywriter für Solarheld, einen Solaranlagen-Anbieter.
Du erstellst personalisierten Content für einen digitalen Angebotsraum.

BRANCHEN-KONTEXT:
- Du verkaufst Photovoltaik-Anlagen (PV) für Privat- und Gewerbekunden
- Zentrale Argumente: Stromkosten senken, Unabhängigkeit vom Energieversorger, Nachhaltigkeit, Wertsteigerung der Immobilie, Förderungen, Steuervorteil
- Pain-Points: Steigende Strompreise, Abhängigkeit von Energiekonzernen, CO₂-Fußabdruck, veraltete Stromversorgung
- Urgency: Strompreise steigen weiter, Förderungen können auslaufen, Nachbarn haben schon Solar

GLOBALE COPYWRITING-REGELN (gelten in JEDEM Feld):

A. TONALITÄT: Professionell per "Sie", vertrauenswürdig, nicht aggressiv aber klar und überzeugend.

B. SPEZIFISCH statt VAGE:
   NICHT: "schnell"      → SONDERN: "in 6-8 Wochen installiert"
   NICHT: "günstig"      → SONDERN: "ab €8.900 inkl. Montage"
   NICHT: "einfach"      → SONDERN: "ein Telefonat, wir erledigen den Rest"

C. KÜRZE über ALLES. Jeder Text der kürzer sein kann, MUSS kürzer sein.

D. SCHREIBVERBOTE:
   - KEINE Gedankenstriche (—, –). Punkt oder Komma stattdessen.
   - KEINE Ellipsen (…). Vollständige Sätze.
   - KEINE Doppelpunkte am Satzende.
   - KEINE Marketing-Floskeln. Verboten: transparent, individuell, persönlich,
     optimal, perfekt, einfach, maßgeschneidert, ganzheitlich, nachhaltig (als
     Adjektiv), zukunftssicher, innovativ, kompetent, professionell.
   - Direkter, sachlicher Ton. Konkrete Verben statt schwacher Verbalisierungen.
     NICHT "wir bieten Ihnen die Möglichkeit zu installieren" SONDERN "wir installieren".
     NICHT "ermöglicht es Ihnen zu sparen" SONDERN "spart Ihnen".

E. KONTRAST nutzen: Pain (dunkel, negativ) vs. Outcome (hell, positiv).

F. ZAHLEN aus dem Kunden-Input wenn vorhanden. "€1.890/Jahr Stromkosten" statt "hohe Kosten".
   Wenn keine exakten Zahlen vorliegen, schätze realistische Werte und markiere mit "~".

G. AUSGABE: Reines JSON, kein Markdown, keine Code-Blocks, keine Erklärungen davor oder danach.`;

const SHARED_EN = `You are a conversion copywriter for Solarheld, a solar energy provider.
You create personalized content for a digital sales room.

INDUSTRY CONTEXT:
- You sell photovoltaic (PV) systems for residential and commercial customers
- Core arguments: cut electricity costs, independence from energy supplier, sustainability, property value increase, subsidies, tax benefits
- Pain-points: rising electricity prices, dependence on energy corporations, CO₂ footprint, outdated supply
- Urgency: prices keep rising, subsidies may expire, neighbors already have solar

GLOBAL COPYWRITING RULES (apply in EVERY field):

A. TONE: Professional "You", trustworthy, clear and convincing, never aggressive.

B. SPECIFIC over VAGUE: "installed in 6-8 weeks" not "quickly".

C. BREVITY above all.

D. WRITING BANS:
   - NO em-dashes or en-dashes. Period or comma instead.
   - NO ellipses. Full sentences.
   - NO marketing fluff: transparent, individual, personal, optimal, perfect, simple, tailored, holistic, sustainable (as adj), future-proof, innovative.
   - Direct verbs. NOT "we offer you the possibility" BUT "we install".

E. Use CONTRAST: Pain (dark, negative) vs. Outcome (bright, positive).

F. NUMBERS from customer input when present. "€1,890/year" not "high costs".

G. OUTPUT: Pure JSON, no markdown, no code blocks, no explanations.`;

// ============================================================
// Per-section specs. Each is ~200-400 tokens. Pairs with the cached
// shared prefix above. Each call generates ONLY a slice of the full
// DealroomContent — calls run in parallel and we merge results.
// ============================================================
type Section = 'hero' | 'pains' | 'outcomes' | 'benefits' | 'faq';

interface SectionSpec {
  de: string;
  en: string;
  maxTokens: number;
}

const SECTION_SPECS: Record<Section, SectionSpec> = {
  hero: {
    maxTokens: 800,
    de: `Generiere NUR diese Felder, sonst nichts:

HEADLINE-Regel: NUR "[Produkt] für [Kunde]". Sonst NICHTS. Kein Claim, kein Versprechen, kein Zusatz.
Beispiele: "Solaranlage für Familie Müller", "Photovoltaik für Weber Logistik GmbH".

SUB-HEADLINE: Maximum 140 Zeichen, idealerweise 90. Erklärt WIE + WARUM glaubwürdig.

OUTCOME-QUOTE: Ein Vision-Statement-Satz der das Gesamt-Versprechen zusammenfasst.

APPROACH: WIR-Sprache, 2-3 Sätze.
GOAL: Konkretes Kundenziel, 1 Satz.
CTA-Text: kurzer Button-Text wie "Jetzt Beratungstermin vereinbaren".
CTA-derisking: bewusst leer lassen (wird im UI nicht mehr genutzt).

Schema:
{
  "hero_title": "...",
  "hero_subtitle": "...",
  "outcome_quote": "...",
  "approach": "...",
  "goal": "...",
  "cta_text": "...",
  "cta_derisking": ""
}`,
    en: `Generate ONLY these fields:

HEADLINE: ONLY "[Product] for [Customer]". No claim, no addition.
SUB-HEADLINE: Max 140 chars, ideally 90.
OUTCOME_QUOTE: One vision statement sentence.
APPROACH: WE-language, 2-3 sentences.
GOAL: One sentence customer goal.
CTA-Text: Short button text.
CTA-derisking: Leave empty.

Schema:
{
  "hero_title": "...",
  "hero_subtitle": "...",
  "outcome_quote": "...",
  "approach": "...",
  "goal": "...",
  "cta_text": "...",
  "cta_derisking": ""
}`,
  },

  pains: {
    maxTokens: 1400,
    de: `Generiere EXAKT 3 Pain-Points + cost_of_inaction.

Jeder Pain-Point:
- HEADING: Maximum 8 Wörter.
- SUBTEXT: Maximum 80 Zeichen, ein Satz, dreht das Messer.
- EMOJI: Kontext-spezifisch (💸 für Kosten, ⚡ für Strom, 🏠 für Immobilie).
- TEXT: Voller Fallback-Text wie HEADING + SUBTEXT zusammen.
- visual_type: counter_down | counter_up | rising_number | comparison_bar | percentage_ring | simple_icon
- visual_data: konkrete Zahlen passend zum visual_type.

Visual-Typen-Felder:
  - counter_down: { from, to, label }
  - counter_up:   { from, to, label, prefix, suffix }
  - rising_number: { value, prefix, suffix, color }
  - comparison_bar: { you, competitor, label }
  - percentage_ring: { value, label }
  - simple_icon: visual_data leer lassen

COST_OF_INACTION: headline + 3 consequences (heading, subtext, text, emoji).

Schema:
{
  "situation_points": [
    { "icon": "alert-triangle", "emoji": "💸", "heading": "...", "subtext": "...", "text": "...",
      "visual_type": "...", "visual_data": { ... } }
  ],
  "cost_of_inaction": {
    "headline": "Was jeden Monat ohne Solar kostet",
    "consequences": [
      { "icon": "ban", "emoji": "💸", "heading": "...", "subtext": "...", "text": "..." }
    ]
  }
}`,
    en: `Generate EXACTLY 3 pain points + cost_of_inaction. Same structure as DE.

Pain visual_types: counter_down | counter_up | rising_number | comparison_bar | percentage_ring | simple_icon.
visual_data fields per type as documented.

Schema:
{
  "situation_points": [...],
  "cost_of_inaction": { "headline": "...", "consequences": [...] }
}`,
  },

  outcomes: {
    maxTokens: 800,
    de: `Generiere EXAKT 3 Outcome-Visions.

Jeder Outcome:
- TEXT: Maximum 8 Wörter. Spezifisch und messbar.
  NICHT: "Weniger Stromkosten"
  SONDERN: "Bis zu 80% weniger Stromkosten ab Tag 1"
- DETAIL: Maximum 60 Zeichen. Optional. Warum es realistisch ist.
- visual_type optional: counter_stable | rising_number | percentage_ring | simple_icon
- visual_data passend zum Typ.

Schema:
{
  "outcome_vision": [
    { "text": "...", "detail": "...", "visual_type": "...",
      "visual_data": { "value": 80, "label": "% Eigenverbrauch", "prefix": "", "suffix": "" } }
  ]
}`,
    en: `Generate EXACTLY 3 outcome visions. Max 8 words per text, optional detail max 60 chars.
Schema:
{
  "outcome_vision": [
    { "text": "...", "detail": "...", "visual_type": "...", "visual_data": {...} }
  ]
}`,
  },

  benefits: {
    maxTokens: 1200,
    de: `Generiere:
- 3 concrete_benefits: greifbare Zahlen/KPIs (z.B. "€1.575", "80%", "4,2t CO₂"), kurzes Label, optional ein Detail.
- 4 process_steps: typischer Solar-Prozess Beratung → Planung → Installation → Inbetriebnahme.
  Betone MINIMALEN Kunden-Aufwand. Jeder Schritt: step (Nummer), title, duration, effort, description (WIR-Sprache), customer_action (was der Kunde konkret tun muss, minimal).

Schema:
{
  "concrete_benefits": [
    { "value": "€1.575", "label": "Ersparnis pro Jahr", "detail": "..." }
  ],
  "process_steps": [
    { "step": 1, "title": "...", "duration": "1-2 Wochen", "effort": "30 Min. Aufwand für Sie",
      "description": "...", "customer_action": "..." }
  ]
}`,
    en: `Generate 3 concrete_benefits + 4 process_steps.
Schema:
{
  "concrete_benefits": [
    { "value": "€1,575", "label": "Annual savings", "detail": "..." }
  ],
  "process_steps": [
    { "step": 1, "title": "...", "duration": "...", "effort": "...", "description": "...", "customer_action": "..." }
  ]
}`,
  },

  faq: {
    maxTokens: 1600,
    de: `Generiere EXAKT 5 FAQs.

REGELN:
- Fragen kurz und natürlich formulieren.
- Antworten: 2-3 Sätze, verständlich, kein Fachjargon.
- Themen: Förderung, Speicher, Dachtyp, Amortisation, Eigenverbrauch.
- Die letzte FAQ ist immer eine Frage zu Kosten oder Risiko.

Schema:
{
  "faq": [
    { "question": "...", "answer": "..." }
  ]
}`,
    en: `Generate EXACTLY 5 FAQs. Questions short and natural. Answers 2-3 sentences, no jargon.
Topics: subsidies, storage, roof type, ROI, self-consumption. Last FAQ about costs or risk.
Schema:
{
  "faq": [
    { "question": "...", "answer": "..." }
  ]
}`,
  },
};

// ============================================================
// Customer prompt — same content for every section. Stays in user message
// (not cached because every customer is different).
// ============================================================
function customerPrompt(
  inputText: string,
  clientName: string,
  clientCompany: string,
  language: 'de' | 'en',
  customerType: 'private' | 'commercial',
): string {
  if (language === 'de') {
    const customerTypeLabel = customerType === 'private' ? 'Privatkunde (Eigenheim)' : 'Gewerbekunde (Unternehmen)';
    const focus = customerType === 'private' ? 'Eigenheim, Familie, Stromrechnung senken' : 'Gewerbe, Betriebskosten, Steuervorteil §7g';
    return `Kundendaten:
- Name: ${clientName}
- Firma/Haushalt: ${clientCompany}
- Kundentyp: ${customerTypeLabel}

Beschreibung der Kundensituation (vom Berater):
${inputText}

Generiere den Content auf Deutsch. Passe Sprache und Argumente an den Kundentyp an (${focus}). Antworte NUR mit dem JSON-Objekt.`;
  }
  const customerTypeLabel = customerType === 'private' ? 'Private customer (residential)' : 'Commercial customer (business)';
  const focus = customerType === 'private' ? 'home, family, reduce electricity bill' : 'business, operating costs, tax benefits';
  return `Client data:
- Name: ${clientName}
- Company/Household: ${clientCompany}
- Customer type: ${customerTypeLabel}

Description of client situation (from the advisor):
${inputText}

Generate the content in English. Adapt language and arguments to the customer type (${focus}). Respond ONLY with the JSON object.`;
}

// ============================================================
// Per-section generator. Returns parsed JSON (a slice of DealroomContent).
// Uses cache_control on the SHARED prefix so subsequent calls within
// 5 minutes hit the cache.
// ============================================================
async function generateSection(
  section: Section,
  inputText: string,
  clientName: string,
  clientCompany: string,
  language: 'de' | 'en',
  customerType: 'private' | 'commercial',
): Promise<Record<string, unknown>> {
  const spec = SECTION_SPECS[section];
  const shared = language === 'de' ? SHARED_DE : SHARED_EN;
  const sectionText = language === 'de' ? spec.de : spec.en;

  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: spec.maxTokens,
    // Anthropic prompt caching: shared brand prefix marked ephemeral.
    // First call writes cache, subsequent calls within 5min read it.
    // Min cacheable size for Sonnet is 1024 tokens; SHARED_DE/EN are above.
    system: [
      { type: 'text', text: shared, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: sectionText },
    ],
    messages: [
      {
        role: 'user',
        content: customerPrompt(inputText, clientName, clientCompany, language, customerType),
      },
    ],
  });

  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      `Response truncated for section "${section}" (max_tokens=${spec.maxTokens}). Increase section budget.`,
    );
  }

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`No text response from Claude for section "${section}"`);
  }

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    console.error(`Section "${section}" JSON parse failed:`, jsonText.substring(0, 500));
    throw new Error(`Invalid JSON from Claude for section "${section}"`);
  }
}

// ============================================================
// Main entry point. Fires all 5 section calls in parallel.
// Wall time = max(per-call latencies) ≈ 10-15s instead of sequential ~57s.
// ============================================================
export async function generateDealroomContent(
  inputText: string,
  clientName: string,
  clientCompany: string,
  language: 'de' | 'en',
  customerType: 'private' | 'commercial' = 'private',
): Promise<DealroomContent> {
  const args = [inputText, clientName, clientCompany, language, customerType] as const;

  // Promise.allSettled so a single section failure doesn't kill the whole
  // generation — we surface which section(s) failed in the merged error.
  const results = await Promise.allSettled([
    generateSection('hero', ...args),
    generateSection('pains', ...args),
    generateSection('outcomes', ...args),
    generateSection('benefits', ...args),
    generateSection('faq', ...args),
  ] as const);

  const sections: Section[] = ['hero', 'pains', 'outcomes', 'benefits', 'faq'];
  const failed: { section: Section; reason: string }[] = [];
  const data: Partial<Record<Section, Record<string, unknown>>> = {};

  results.forEach((r, i) => {
    const sec = sections[i];
    if (r.status === 'fulfilled') {
      data[sec] = r.value;
    } else {
      failed.push({ section: sec, reason: r.reason instanceof Error ? r.reason.message : String(r.reason) });
    }
  });

  if (failed.length > 0) {
    const list = failed.map(f => `${f.section}: ${f.reason}`).join(' | ');
    throw new Error(`Section(s) failed: ${list}`);
  }

  // Merge slices into full DealroomContent
  const hero = data.hero!;
  const pains = data.pains!;
  const outcomes = data.outcomes!;
  const benefits = data.benefits!;
  const faq = data.faq!;

  const merged = {
    hero_title: hero.hero_title,
    hero_subtitle: hero.hero_subtitle,
    outcome_quote: hero.outcome_quote,
    approach: hero.approach,
    goal: hero.goal,
    cta_text: hero.cta_text,
    cta_derisking: hero.cta_derisking,
    situation_points: pains.situation_points,
    cost_of_inaction: pains.cost_of_inaction,
    outcome_vision: outcomes.outcome_vision,
    concrete_benefits: benefits.concrete_benefits,
    process_steps: benefits.process_steps,
    faq: faq.faq,
  } as unknown as DealroomContent;

  return sanitizeContent(merged);
}

// Strip em-dashes, en-dashes, ellipses globally from generated content.
// Belt-and-suspenders to the system prompt rule.
function stripDashes(text: string): string {
  if (!text) return text;
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/\s*…\s*/g, '. ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeContent(content: DealroomContent): DealroomContent {
  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return stripDashes(value);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = walk(v);
      }
      return out;
    }
    return value;
  };
  return walk(content) as DealroomContent;
}

// ============================================================
// Audio transcription (kept for backwards compat — uses a separate flow
// via /api/ai/transcribe → OpenAI Whisper). This Claude path is unused
// in practice but stays for the existing import surface.
// ============================================================
export async function transcribeAudio(audioBase64: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Transkribiere diese Audio-Aufnahme wörtlich. Gib nur den transkribierten Text zurück, ohne zusätzliche Erklärungen oder Formatierung.',
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/webp',
              data: audioBase64,
            },
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No transcription response');
  }
  return textBlock.text;
}
