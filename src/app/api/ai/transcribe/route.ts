import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Upload audio to Supabase Storage
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Audio upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(uploadData.path);

    // For MVP: return a placeholder - real transcription would use Whisper or similar
    // Claude's API doesn't directly support audio transcription in the current SDK
    // In production, you'd integrate with OpenAI Whisper or Google Speech-to-Text
    return NextResponse.json({
      text: '',
      audioUrl: publicUrl,
      note: 'Audio uploaded. Please enter the transcription manually or use the text input method.',
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
