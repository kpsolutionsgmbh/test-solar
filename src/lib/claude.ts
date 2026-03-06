import Anthropic from '@anthropic-ai/sdk';
import { DealroomContent } from '@/types/database';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT_DE = `Du bist ein erfahrener Sales-Copywriter für Gündesli & Kollegen, eine Versicherungsmakler-Agentur und Bezirksdirektion der SIGNAL IDUNA Gruppe mit über 4.000 Kunden, 50+ Auszeichnungen und einem 6-köpfigen Expertenteam in Gummersbach.

Deine Aufgabe: Aus der Beschreibung einer Kundensituation generierst du strukturierten, überzeugenden Content für einen personalisierten Digital Sales Room.

Tonalität: Professionell, vertrauenswürdig, empathisch, aber klar und überzeugend. Nicht aggressiv, aber deutlich in der Darstellung von Konsequenzen.

Konversions-Psychologie: Problem erkennen → Schmerz verstärken → Lösung aufzeigen → Beweis liefern → Handlung auslösen.

Du MUSST exakt dieses JSON-Schema als Antwort liefern (ohne Markdown-Code-Blocks, nur reines JSON):`;

const SYSTEM_PROMPT_EN = `You are an experienced sales copywriter for Gündesli & Kollegen, an insurance brokerage agency and district directorate of SIGNAL IDUNA Group with over 4,000 clients, 50+ awards and a team of 6 experts in Gummersbach, Germany.

Your task: From a description of a client situation, generate structured, persuasive content for a personalized Digital Sales Room.

Tone: Professional, trustworthy, empathetic but clear and convincing. Not aggressive, but precise in presenting consequences.

Conversion psychology: Identify problem → Amplify pain → Present solution → Provide proof → Drive action.

You MUST respond with exactly this JSON schema (no markdown code blocks, just pure JSON):`;

const JSON_SCHEMA = `{
  "hero_title": "Personalized title for the hero section",
  "hero_subtitle": "Subtitle with context",
  "situation_points": [
    { "icon": "alert-triangle", "text": "Pain point 1" },
    { "icon": "clock", "text": "Pain point 2" },
    { "icon": "trending-down", "text": "Pain point 3" }
  ],
  "goal": "Specific client goal (1 sentence)",
  "approach": "Broker's solution approach (2-3 sentences)",
  "cost_of_inaction": {
    "headline": "What every additional month without a solution costs",
    "consequences": [
      { "icon": "ban", "text": "Consequence 1" },
      { "icon": "heart-pulse", "text": "Consequence 2" },
      { "icon": "users", "text": "Consequence 3" }
    ]
  },
  "outcome_vision": [
    "Promised result 1",
    "Promised result 2",
    "Promised result 3"
  ],
  "process_steps": [
    { "step": 1, "title": "Step title", "duration": "3-5 days", "effort": "45 min effort", "description": "..." },
    { "step": 2, "title": "...", "duration": "...", "effort": "...", "description": "..." }
  ],
  "guarantee_text": "Our promise / guarantee text",
  "cta_text": "Call-to-action text"
}`;

export async function generateDealroomContent(
  inputText: string,
  clientName: string,
  clientCompany: string,
  language: 'de' | 'en'
): Promise<DealroomContent> {
  const systemPrompt = language === 'de' ? SYSTEM_PROMPT_DE : SYSTEM_PROMPT_EN;

  const userPrompt = language === 'de'
    ? `Kundendaten:
- Name: ${clientName}
- Firma: ${clientCompany}

Beschreibung der Kundensituation (vom Makler):
${inputText}

Generiere den Content auf Deutsch. Antworte NUR mit dem JSON-Objekt.`
    : `Client data:
- Name: ${clientName}
- Company: ${clientCompany}

Description of client situation (from the broker):
${inputText}

Generate the content in English. Respond ONLY with the JSON object.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `${systemPrompt}\n\n${JSON_SCHEMA}`,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = JSON.parse(textBlock.text) as DealroomContent;
  return parsed;
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
