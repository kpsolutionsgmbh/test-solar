import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient
      .from('email_flows')
      .select('*')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Email flows DB error:', error.message);
      return NextResponse.json({ error: 'Operation fehlgeschlagen' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient
      .from('email_flows')
      .insert({ ...body, admin_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Email flows DB error:', error.message);
      return NextResponse.json({ error: 'Operation fehlgeschlagen' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, selected_dealroom_ids, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing flow id' }, { status: 400 });

    const serviceClient = createServiceRoleClient();

    // Verify ownership
    const { data: existing } = await serviceClient
      .from('email_flows')
      .select('admin_id')
      .eq('id', id)
      .single();

    if (!existing || existing.admin_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data, error } = await serviceClient
      .from('email_flows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Email flows DB error:', error.message);
      return NextResponse.json({ error: 'Operation fehlgeschlagen' }, { status: 500 });
    }

    // Update selected dealrooms if provided
    if (Array.isArray(selected_dealroom_ids)) {
      await serviceClient.from('email_flow_dealrooms').delete().eq('flow_id', id);
      if (selected_dealroom_ids.length > 0) {
        await serviceClient.from('email_flow_dealrooms').insert(
          selected_dealroom_ids.map((dealroom_id: string) => ({ flow_id: id, dealroom_id }))
        );
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
