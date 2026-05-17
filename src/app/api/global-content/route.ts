import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { mergeWithDefaults, type GlobalContent } from '@/lib/global-content-types';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('global_content')
    .select('content')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const content = mergeWithDefaults((data?.content || {}) as GlobalContent);
  return NextResponse.json({ content });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { content: GlobalContent };
  if (!body || typeof body.content !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: admin } = await supabase.from('admin_users').select('id').limit(1).single();
  if (!admin) {
    return NextResponse.json({ error: 'No admin user' }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from('global_content')
    .select('id')
    .eq('admin_id', admin.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('global_content')
      .update({ content: body.content, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('global_content')
      .insert({ admin_id: admin.id, content: body.content });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Invalidate every public dealroom so they pick up new shared content.
  revalidatePath('/d/[slug]', 'page');
  return NextResponse.json({ ok: true });
}
