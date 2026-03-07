import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authClient = createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;

    if (!file || !bucket) {
      return NextResponse.json({ error: 'Missing file or bucket' }, { status: 400 });
    }

    const allowedBuckets = ['logos', 'avatars', 'references', 'documents'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${bucket}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
