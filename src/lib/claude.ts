import Anthropic from '@anthropic-ai/sdk';
import { DealroomContent } from '@/types/database';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT_DE = `Du bist ein Conversion-Copywriter für Solarheld, einen Solaranlagen-Anbieter.
Du erstellst personalisierten Content für einen digitalen Angebotsraum.

BRANCHEN-KONTEXT:
- Du verkaufst Photovoltaik-Anlagen (PV) für Privat- und Gewerbekunden
- Zentrale Argumente: Stromkosten senken, Unabhängigkeit vom Energieversorger, Nachhaltigkeit, Wertsteigerung der Immobilie, Förderungen, Steuervorteil
- Pain-Points: Steigende Strompreise, Abhängigkeit von Energiekonzernen, CO₂-Fußabdruck, veraltete Stromversorgung
- Urgency: Strompreise steigen weiter, Förderungen können auslaufen, Nachbarn haben schon Solar

COPYWRITING-REGELN:

1. HEADLINE (H1): NUR "[Produkt] für [Kunde]". Sonst NICHTS.
   KEIN Claim dahinter, KEIN Ergebnis-Versprechen, KEIN Zusatz.
   Beispiele:
   - "Solaranlage für Familie Müller"
   - "Photovoltaik für Weber Logistik GmbH"
   - "Solar + Speicher für die Bäckerei Krause"
   NICHT: "Solaranlage für Familie Müller – Stromkosten senken"

2. SUB-HEADLINE: Maximal 1-2 Sätze.
   Erklärt WIE das Ergebnis möglich ist + WARUM glaubwürdig.
   Beispiel: "Basierend auf unserer Erfahrung und zufriedenen Kunden – unabhängig beraten, transparent kalkuliert."

3. PAIN POINTS: Generiere EXAKT 3 Pain-Points. Nicht mehr, nicht weniger.
   Jeder Pain braucht:
   - HEADING: Maximum 8 Wörter.
   - SUBTEXT: Maximum 1 Satz (15-20 Wörter). Dreht das Messer.
   - EMOJI: Kontext-spezifisch (z.B. 💸 für Kosten, ⚡ für Strom, 🏠 für Immobilie).
   - visual_type: Wähle einen Typ der den Pain visuell zeigt.
   - visual_data: Konkrete Zahlen für die Visualisierung.

   Visual-Typen:
   - counter_down: Zahl die sinkt. Felder: from, to, label
   - counter_up: Kosten die steigen. Felder: from (optional), to (=value), label, prefix, suffix
   - rising_number: Eine große Impact-Zahl. Felder: value, prefix, suffix, color
   - comparison_bar: Vergleich. Felder: you, competitor, label
   - percentage_ring: Prozentuales Risiko. Felder: value, label
   - simple_icon: Nur großes Icon. Keine visual_data nötig.

   Sei SPEZIFISCH. Nutze echte Zahlen aus dem Kunden-Input wenn vorhanden.
   "€1.890/Jahr Stromkosten" statt "hohe Kosten". "35 ct/kWh" statt "teurer Strom".
   Wenn keine exakten Zahlen vorliegen, schätze realistische Werte und markiere mit "~".

4. DREAM OUTCOMES: Generiere EXAKT 3 Ergebnisse.
   Jedes Ergebnis: Maximum 8 Wörter. Spezifisch und messbar.
   NICHT: "Weniger Stromkosten"
   SONDERN: "Bis zu 80% weniger Stromkosten ab Tag 1"
   Jedes Outcome bekommt optional visual_type + visual_data.
   Füge ein outcome_quote hinzu: ein Vision-Statement.

5. PROZESS-SCHRITTE: Betone den MINIMALEN AUFWAND für den Kunden.
   Typischer Solar-Prozess: Beratung → Planung → Installation → Inbetriebnahme.
   Ergänze customer_action: Was der Kunde konkret tun muss (minimal).

6. NICHT GENERIEREN: Keinen Guarantee-Text, keinen "Unser Versprechen"-Block.

7. TONALITÄT: Professionell per "Sie", vertrauenswürdig, nicht aggressiv aber klar und überzeugend.

8. KONTRAST nutzen: Pain (dunkel, negativ) vs. Outcome (hell, positiv).

9. SPEZIFISCH statt VAGE:
   NICHT: "schnell"      → SONDERN: "in 6-8 Wochen installiert"
   NICHT: "günstig"      → SONDERN: "ab €8.900 inkl. Montage"
   NICHT: "einfach"      → SONDERN: "ein Telefonat, wir erledigen den Rest"

10. KÜRZE über ALLES: Jeder Text der kürzer sein kann, MUSS kürzer sein.
   TEXTLÄNGE-REGELN:
   - Pain Headings: Maximum 8 Wörter.
   - Pain Subtext: Maximum 1 Satz (15-20 Wörter).
   - Outcome Text: Maximum 8 Wörter pro Outcome.
   - FAQ Antworten: Maximum 2 Sätze.

11. KONKRETE ZAHLEN (concrete_benefits): Generiere 3 greifbare Zahlen/KPIs.
   Große Zahlen oben (z.B. "€1.575", "80%", "4,2t CO₂"), kurzes Label, optionales Detail.

12. FAQ: Generiere 5 häufige Fragen passend zum Solarprodukt.
   REGELN:
   - Fragen kurz und natürlich formulieren
   - Antworten: 2-3 Sätze, verständlich, kein Fachjargon
   - KEINE Gedankenstriche (—) verwenden
   - KEINE Bullet-Listen in den Antworten
   - Themen: Förderung, Speicher, Dachtyp, Amortisation, Eigenverbrauch
   - Die letzte FAQ soll immer eine Frage zu Kosten/Risiko sein

Konversions-Psychologie: Problem erkennen → Schmerz verstärken → Lösung aufzeigen → Beweis liefern → Handlung auslösen.

Du MUSST exakt dieses JSON-Schema als Antwort liefern (ohne Markdown-Code-Blocks, nur reines JSON):`;

const SYSTEM_PROMPT_EN = `You are a conversion copywriter for Solarheld, a solar energy provider.
You create personalized content for a digital sales room.

INDUSTRY CONTEXT:
- You sell photovoltaic systems (PV) for residential and commercial customers
- Key arguments: Reduce electricity costs, energy independence, sustainability, property value increase, subsidies, tax benefits
- Pain points: Rising electricity prices, dependence on energy providers, carbon footprint, outdated energy supply
- Urgency: Electricity prices keep rising, subsidies may expire, neighbors already have solar

COPYWRITING RULES:

1. HEADLINE (H1): ONLY "[Product] for [Customer Name]". Nothing else.
   Examples: "Solar System for the Miller Family", "Photovoltaics for Weber Logistics GmbH"
   NOT: "Solar System for the Miller Family – reduce costs"

2. SUB-HEADLINE: Maximum 1-2 sentences. HOW + WHY credible.

3. PAIN POINTS: Generate EXACTLY 3 pain points.
   Each pain needs: HEADING (max 8 words), SUBTEXT (max 1 sentence), EMOJI, visual_type, visual_data.
   Visual types: counter_down, counter_up, rising_number, comparison_bar, percentage_ring, simple_icon.
   Be SPECIFIC with real numbers.

4. DREAM OUTCOMES: Generate EXACTLY 3 outcomes. Max 8 words each, specific and measurable.
   Add an outcome_quote vision statement.

5. PROCESS STEPS: Emphasize MINIMAL EFFORT. Add customer_action.

6. DO NOT GENERATE: No guarantee text, no "Our Promise" block.

7. TONE: Professional "Sie/You", trustworthy, clear and convincing.

8. Use CONTRAST: Pain (dark, negative) vs. Outcome (bright, positive).

9. SPECIFIC over VAGUE: "installed in 6-8 weeks" not "quickly".

10. BREVITY above all. Pain Headings: max 8 words. FAQ Answers: max 2 sentences.

11. CONCRETE BENEFITS: 3 tangible numbers/KPIs.

12. FAQ: 5 questions about solar topics (subsidies, storage, roof type, ROI, self-consumption).
   Last FAQ should always be about costs/risk.

Conversion psychology: Identify problem → Amplify pain → Present solution → Provide proof → Drive action.

You MUST respond with exactly this JSON schema (no markdown code blocks, just pure JSON):`;

const JSON_SCHEMA = `{
  "hero_title": "ONLY [Solar Product] for [Customer Name]. No claim, no addition.",
  "hero_subtitle": "How + Why credible (max 1-2 sentences)",
  "situation_points": [
    {
      "icon": "alert-triangle",
      "emoji": "💸",
      "heading": "Max 8 words – scannable headline",
      "subtext": "Max 1 sentence – emotional subtext",
      "text": "Full pain point text (fallback)",
      "visual_type": "counter_down | counter_up | rising_number | comparison_bar | percentage_ring | simple_icon",
      "visual_data": { "from": 35, "to": 29, "label": "ct/kWh", "prefix": "", "suffix": "", "value": 0, "you": 0, "competitor": 0, "color": "red" }
    }
  ],
  "goal": "Specific client goal (1 sentence)",
  "approach": "Solution approach with WE-language (2-3 sentences)",
  "cost_of_inaction": {
    "headline": "What every additional month without solar costs",
    "consequences": [
      {
        "icon": "ban",
        "emoji": "💸",
        "heading": "Consequence as scannable headline",
        "subtext": "Emotional detail text",
        "text": "Full consequence text (fallback)"
      }
    ]
  },
  "outcome_vision": [
    {
      "text": "Max 8 words – specific, measurable result",
      "detail": "Why it is realistic (optional)",
      "visual_type": "counter_stable | rising_number | percentage_ring | simple_icon (optional)",
      "visual_data": { "value": 80, "label": "% Eigenverbrauch", "prefix": "", "suffix": "" }
    }
  ],
  "outcome_quote": "Vision statement that summarizes everything in one powerful sentence",
  "process_steps": [
    {
      "step": 1,
      "title": "Step title",
      "duration": "1-2 Wochen",
      "effort": "30 Min. Aufwand für Sie",
      "description": "WE-language: What we do for you",
      "customer_action": "The only thing you do: [minimal action]"
    }
  ],
  "concrete_benefits": [
    {
      "value": "€1.575",
      "label": "Ersparnis pro Jahr",
      "detail": "Basierend auf Ihrem Verbrauch und Ihrer Dachfläche"
    },
    {
      "value": "4,2t",
      "label": "CO₂ gespart pro Jahr",
      "detail": "Ihr Beitrag zum Klimaschutz"
    },
    {
      "value": "€0",
      "label": "Beratungskosten",
      "detail": "Kostenlose Erstberatung ohne Verpflichtung"
    }
  ],
  "cta_text": "Jetzt Beratungstermin vereinbaren",
  "cta_derisking": "Kostenlos & unverbindlich",
  "faq": [
    { "question": "Häufige Frage zum Thema Solar", "answer": "Kurze, vertrauensbildende Antwort (2-3 Sätze)" }
  ]
}`;

export async function generateDealroomContent(
  inputText: string,
  clientName: string,
  clientCompany: string,
  language: 'de' | 'en',
  customerType: 'private' | 'commercial' = 'private'
): Promise<DealroomContent> {
  const systemPrompt = language === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;

  const customerTypeLabel = language === 'de'
    ? (customerType === 'private' ? 'Privatkunde (Eigenheim)' : 'Gewerbekunde (Unternehmen)')
    : (customerType === 'private' ? 'Private customer (residential)' : 'Commercial customer (business)');

  const userPrompt = language === 'de'
    ? `Kundendaten:
- Name: ${clientName}
- Firma/Haushalt: ${clientCompany}
- Kundentyp: ${customerTypeLabel}

Beschreibung der Kundensituation (vom Berater):
${inputText}

Generiere den Content auf Deutsch. Passe Sprache und Argumente an den Kundentyp an (${customerType === 'private' ? 'Eigenheim, Familie, Stromrechnung senken' : 'Gewerbe, Betriebskosten, Steuervorteil §7g'}). Antworte NUR mit dem JSON-Objekt.`
    : `Client data:
- Name: ${clientName}
- Company/Household: ${clientCompany}
- Customer type: ${customerTypeLabel}

Description of client situation (from the advisor):
${inputText}

Generate the content in English. Adapt language and arguments to the customer type (${customerType === 'private' ? 'home, family, reduce electricity bill' : 'business, operating costs, tax benefits'}). Respond ONLY with the JSON object.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: `${systemPrompt}\n\n${JSON_SCHEMA}`,
    messages: [{ role: 'user', content: userPrompt }],
  });

  if (message.stop_reason === 'max_tokens') {
    console.error('Claude response truncated (max_tokens reached)');
    throw new Error('Response truncated – content too long');
  }

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Strip markdown code blocks if Claude wraps the JSON
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonText) as DealroomContent;
    return parsed;
  } catch {
    console.error('Failed to parse Claude response:', jsonText.substring(0, 500));
    throw new Error('Invalid JSON from Claude');
  }
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
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
