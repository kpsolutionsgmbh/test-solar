import { NextRequest, NextResponse } from 'next/server';
import { generateDealroomContent } from '@/lib/claude';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Auth-gated to prevent unauth callers burning the Anthropic API key budget.
// Plus hard input caps so even an authenticated caller cannot DoS the API.
const MAX_INPUT_TEXT = 5000;
const MAX_NAME = 200;

export async function POST(request: NextRequest) {
  // Surface the actual error class up to the client so admins can debug.
  // Route is admin-only (middleware + getUser gate), so leaking server-error
  // text is safe.
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('AI generate: ANTHROPIC_API_KEY env var missing');
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY ist auf dem Server nicht gesetzt. Vercel-Env-Vars prüfen.' },
        { status: 500 }
      );
    }

    const { inputText, clientName, clientCompany, language, customerType } = await request.json();

    if (!inputText || !clientName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (typeof inputText !== 'string' || inputText.length > MAX_INPUT_TEXT) {
      return NextResponse.json(
        { error: `inputText must be a string ≤ ${MAX_INPUT_TEXT} chars` },
        { status: 413 }
      );
    }
    if (typeof clientName !== 'string' || clientName.length > MAX_NAME) {
      return NextResponse.json({ error: 'Invalid clientName' }, { status: 400 });
    }
    if (clientCompany && (typeof clientCompany !== 'string' || clientCompany.length > MAX_NAME)) {
      return NextResponse.json({ error: 'Invalid clientCompany' }, { status: 400 });
    }
    if (language && language !== 'de' && language !== 'en') {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }
    if (customerType && customerType !== 'private' && customerType !== 'commercial') {
      return NextResponse.json({ error: 'Invalid customerType' }, { status: 400 });
    }

    try {
      const content = await generateDealroomContent(
        inputText,
        clientName,
        clientCompany || '',
        language || 'de',
        customerType || 'private'
      );
      return NextResponse.json({ content });
    } catch (err) {
      // Classify Anthropic errors so the admin sees something actionable.
      const anyErr = err as { status?: number; error?: { type?: string; message?: string }; message?: string; name?: string };
      const status = anyErr?.status;
      const apiErrType = anyErr?.error?.type;
      const apiErrMsg = anyErr?.error?.message;
      const errMsg = anyErr?.message || 'Unknown';
      const errName = anyErr?.name || 'Error';

      console.error('AI generate — Anthropic call failed:', {
        status,
        apiErrType,
        apiErrMsg,
        errName,
        errMsg,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      });

      // Build a precise message for the admin
      let userMessage = errMsg;
      if (status === 401 || apiErrType === 'authentication_error') {
        userMessage = 'Anthropic API-Key ist ungültig. In Vercel-Env-Vars prüfen + neuen Key erzeugen.';
      } else if (status === 404 || apiErrType === 'not_found_error') {
        userMessage = `Model '${process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'}' existiert nicht auf der Anthropic API. ANTHROPIC_MODEL Env-Var setzen mit gültigem ID.`;
      } else if (status === 429 || apiErrType === 'rate_limit_error') {
        userMessage = 'Anthropic Rate-Limit erreicht. Kurz warten + erneut versuchen, oder Anthropic Plan upgraden.';
      } else if (status === 529 || apiErrType === 'overloaded_error') {
        userMessage = 'Anthropic Server überlastet. In 30 Sekunden erneut versuchen.';
      } else if (errMsg.includes('truncated')) {
        userMessage = 'Antwort zu lang — Eingabetext kürzen oder erneut versuchen.';
      } else if (errMsg.includes('Invalid JSON')) {
        userMessage = 'Claude hat ungültiges JSON zurückgegeben. Bitte erneut versuchen.';
      } else if (errName === 'AbortError' || errMsg.includes('timeout')) {
        userMessage = 'Anfrage hat Timeout erreicht. Wahrscheinlich Vercel Function maxDuration zu kurz (Pro-Plan nötig für 60s).';
      }

      return NextResponse.json(
        {
          error: userMessage,
          debug: { status, apiErrType, errName },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('AI generate — outer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
}
