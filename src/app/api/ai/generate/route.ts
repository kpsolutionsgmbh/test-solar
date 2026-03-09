import { NextRequest, NextResponse } from 'next/server';
import { generateDealroomContent } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { inputText, clientName, clientCompany, language, customerType } = await request.json();

    if (!inputText || !clientName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const content = await generateDealroomContent(
      inputText,
      clientName,
      clientCompany,
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
