import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateDealroomContent } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inputText, clientName, clientCompany, language } = await request.json();

    if (!inputText || !clientName || !clientCompany) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const content = await generateDealroomContent(
      inputText,
      clientName,
      clientCompany,
      language || 'de'
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Content generation failed: ${message}` },
      { status: 500 }
    );
  }
}
