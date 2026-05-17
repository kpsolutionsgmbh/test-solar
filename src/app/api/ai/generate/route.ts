import { NextRequest, NextResponse } from 'next/server';
import { generateDealroomContent } from '@/lib/claude';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Auth-gated to prevent unauth callers burning the Anthropic API key budget.
// Plus hard input caps so even an authenticated caller cannot DoS the API.
const MAX_INPUT_TEXT = 5000;
const MAX_NAME = 200;

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1)
      .single();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const content = await generateDealroomContent(
      inputText,
      clientName,
      clientCompany || '',
      language || 'de',
      customerType || 'private'
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Content-Generierung fehlgeschlagen. Bitte erneut versuchen.' },
      { status: 500 }
    );
  }
}
