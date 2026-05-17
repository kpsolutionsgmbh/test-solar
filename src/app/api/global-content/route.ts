import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
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
  // Auth gate: must have an authenticated Supabase session.
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { content?: GlobalContent } | null;
  if (!body || typeof body.content !== 'object' || body.content === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Size guard so the JSONB column can never explode.
  const serialized = JSON.stringify(body.content);
  if (serialized.length > 200_000) {
    return NextResponse.json({ error: 'Content too large' }, { status: 413 });
  }

  // Use service role for the write so it works whether or not admin_users
  // exists for this auth user. Single-tenant app — there's one global_content
  // row total.
  const service = createServiceRoleClient();
  const { data: existing } = await service
    .from('global_content')
    .select('id')
    .limit(1)
    .single();

  if (existing) {
    const { error } = await service
      .from('global_content')
      .update({ content: body.content, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Look up an admin_users row to satisfy the FK (if any exists).
    const { data: admin } = await service.from('admin_users').select('id').limit(1).single();
    const { error } = await service
      .from('global_content')
      .insert({ admin_id: admin?.id || null, content: body.content });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Invalidate every public dealroom so they pick up new shared content.
  revalidatePath('/d/[slug]', 'page');
  return NextResponse.json({ ok: true });
}
