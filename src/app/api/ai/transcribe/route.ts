import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Transcribe via OpenAI Whisper when OPENAI_API_KEY is set.
// Falls back to upload-only (returns empty text + audioUrl) for manual entry.
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = (formData.get('language') as string | null) || 'de';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Audio upload failed' }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('audio').getPublicUrl(uploadData.path);

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        text: '',
        audioUrl: publicUrl,
        note: 'Audio gespeichert. Whisper API-Key fehlt — bitte Transkription manuell eintragen.',
      });
    }

    try {
      const whisperForm = new FormData();
      whisperForm.append('file', audioFile, audioFile.name || 'audio.webm');
      whisperForm.append('model', 'whisper-1');
      whisperForm.append('language', language === 'en' ? 'en' : 'de');
      whisperForm.append('response_format', 'json');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: whisperForm,
      });

      if (!whisperRes.ok) {
        const errBody = await whisperRes.text();
        console.error('Whisper API error:', whisperRes.status, errBody);
        return NextResponse.json({
          text: '',
          audioUrl: publicUrl,
          note: 'Audio gespeichert. Automatische Transkription fehlgeschlagen — bitte manuell eintragen.',
        });
      }

      const whisperData = (await whisperRes.json()) as { text?: string };
      return NextResponse.json({
        text: whisperData.text || '',
        audioUrl: publicUrl,
        provider: 'whisper',
      });
    } catch (err) {
      console.error('Whisper call failed:', err);
      return NextResponse.json({
        text: '',
        audioUrl: publicUrl,
        note: 'Audio gespeichert. Automatische Transkription nicht verfügbar.',
      });
    }
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
