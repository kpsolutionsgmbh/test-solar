import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceRoleClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const { dealroomId, recipientEmail, subject, body } = await request.json();
    if (!dealroomId || !recipientEmail || !subject || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (typeof dealroomId !== 'string' || !UUID_REGEX.test(dealroomId)) {
      return NextResponse.json({ error: 'Invalid dealroom id' }, { status: 400 });
    }
    if (typeof recipientEmail !== 'string' || !EMAIL_REGEX.test(recipientEmail)) {
      return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();

    // Get dealroom for slug
    const { data: dealroom } = await serviceClient
      .from('dealrooms')
      .select('slug, client_name, client_company')
      .eq('id', dealroomId)
      .single();

    if (!dealroom) {
      return NextResponse.json({ error: 'Dealroom not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dealroom-app.vercel.app';
    const dealroomUrl = `${baseUrl}/d/${dealroom.slug}?utm_source=email&utm_medium=dealroom&utm_campaign=${dealroomId}`;

    // Replace placeholder in body, then escape user content before inserting into HTML
    const finalBody = body.replace('[LINK]', dealroomUrl);
    const escapedBody = escapeHtml(finalBody).replace(/\n/g, '<br/>');

    // Build HTML email
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <div style="margin-bottom: 32px;">
          <img src="${baseUrl}/images/logo-blue.svg" alt="Solarheld" style="height: 28px;" />
        </div>
        <div style="white-space: pre-line; font-size: 15px; line-height: 1.6; color: #374151;">
          ${escapedBody}
        </div>
        <div style="margin-top: 32px; text-align: center;">
          <a href="${dealroomUrl}" style="display: inline-block; padding: 14px 32px; background-color: #E97E1C; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
            Jetzt Angebot ansehen
          </a>
        </div>
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
          Solarheld GmbH
        </div>
      </div>
    `;

    // Send via Resend (gracefully handle if RESEND_API_KEY is not set)
    const resend = getResend();
    if (!resend) {
      console.log('RESEND_API_KEY not set, skipping email send');
      console.log('Would send to:', recipientEmail, 'Subject:', subject);
    } else {
      const { error: sendError } = await resend.emails.send({
        from: `Solarheld <${process.env.RESEND_FROM_DOMAIN || 'onboarding@resend.dev'}>`,
        to: recipientEmail,
        subject,
        html: htmlBody,
      });

      if (sendError) {
        console.error('Resend error:', sendError);
        return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 });
      }
    }

    // Log email
    await serviceClient.from('email_logs').insert({
      dealroom_id: dealroomId,
      admin_id: null,
      recipient_email: recipientEmail,
      subject,
      body_preview: finalBody.substring(0, 200),
      status: 'sent',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
