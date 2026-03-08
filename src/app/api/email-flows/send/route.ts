import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { dealroomId, recipientEmail, subject, bodyHtml } = body;

    if (!recipientEmail || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin info for "from" field
    const serviceClient = createServiceRoleClient();
    const { data: admin } = await serviceClient
      .from('admin_users')
      .select('name, company_name')
      .eq('id', user.id)
      .single();

    const fromName = admin?.company_name || admin?.name || 'Gündesli & Kollegen';
    const fromDomain = process.env.RESEND_FROM_DOMAIN || 'onboarding@resend.dev';

    // Add unsubscribe link if we have a dealroom
    let finalBody = bodyHtml;
    if (dealroomId) {
      const unsubLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dealroom.guendesliundkollegen.de'}/api/unsubscribe?id=${dealroomId}`;
      finalBody += `\n\n---\n<p style="font-size:11px;color:#999;">Falls Sie keine weiteren E-Mails wünschen: <a href="${unsubLink}">Abmelden</a></p>`;
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { error: sendError } = await resend.emails.send({
      from: `${fromName} <${fromDomain}>`,
      to: recipientEmail,
      subject,
      html: finalBody.replace(/\n/g, '<br>'),
    });

    if (sendError) {
      // Log as failed
      await serviceClient.from('email_flow_logs').insert({
        flow_id: null,
        dealroom_id: dealroomId || null,
        recipient_email: recipientEmail,
        subject,
        status: 'failed',
        skip_reason: sendError.message,
        source: 'manual',
      });
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    // Log as sent
    await serviceClient.from('email_flow_logs').insert({
      flow_id: null,
      dealroom_id: dealroomId || null,
      recipient_email: recipientEmail,
      subject,
      status: 'sent',
      source: 'manual',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
