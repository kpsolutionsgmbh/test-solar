import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function replacePlaceholders(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealroomId, recipientEmail, subject, bodyHtml } = body;

    if (!recipientEmail || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guk-angebot.com';

    // Get admin info (first admin user)
    const { data: admin } = await serviceClient
      .from('admin_users')
      .select('name, company_name, email')
      .limit(1)
      .single();

    const fromName = admin?.company_name || admin?.name || 'Solarheld';
    const fromDomain = process.env.RESEND_FROM_DOMAIN || 'onboarding@resend.dev';

    // Build placeholder data from dealroom + customer + team member
    const replacements: Record<string, string> = {
      '{{anrede}}': '',
      '{{vorname}}': '',
      '{{nachname}}': '',
      '{{firma}}': '',
      '{{produkt}}': '',
      '{{ansprechpartner_name}}': admin?.name || '',
      '{{ansprechpartner_telefon}}': '',
      '{{ansprechpartner_email}}': admin?.email || '',
      '{{dealroom_link}}': '',
      '{{r}}': '',
    };

    if (dealroomId) {
      // Load dealroom with relations
      const { data: dealroom } = await serviceClient
        .from('dealrooms')
        .select('slug, client_name, client_company, customer_id, assigned_member_id')
        .eq('id', dealroomId)
        .single();

      if (dealroom) {
        const dealroomUrl = `${baseUrl}/d/${dealroom.slug}?utm_source=email&utm_medium=dealroom&utm_campaign=${dealroomId}`;
        replacements['{{dealroom_link}}'] = dealroomUrl;
        replacements['{{firma}}'] = dealroom.client_company || '';

        // Try to get customer data
        if (dealroom.customer_id) {
          const { data: customer } = await serviceClient
            .from('customers')
            .select('salutation, first_name, last_name, company')
            .eq('id', dealroom.customer_id)
            .single();

          if (customer) {
            replacements['{{anrede}}'] = customer.salutation || '';
            replacements['{{vorname}}'] = customer.first_name || '';
            replacements['{{nachname}}'] = customer.last_name || '';
            replacements['{{firma}}'] = customer.company || dealroom.client_company || '';
            replacements['{{r}}'] = customer.salutation === 'Herr' ? 'r' : '';
          }
        }

        // Fallback from dealroom.client_name if no customer
        if (!replacements['{{nachname}}'] && dealroom.client_name) {
          const nameParts = dealroom.client_name.split(' ');
          replacements['{{vorname}}'] = nameParts[0] || '';
          replacements['{{nachname}}'] = nameParts.slice(1).join(' ') || '';
        }

        // Get assigned team member for phone
        if (dealroom.assigned_member_id) {
          const { data: member } = await serviceClient
            .from('team_members')
            .select('name, email, phone')
            .eq('id', dealroom.assigned_member_id)
            .single();

          if (member) {
            replacements['{{ansprechpartner_name}}'] = member.name || admin?.name || '';
            replacements['{{ansprechpartner_email}}'] = member.email || admin?.email || '';
            replacements['{{ansprechpartner_telefon}}'] = member.phone || '';
          }
        }
      }
    }

    // Replace placeholders in subject and body
    const finalSubject = replacePlaceholders(subject, replacements);
    let finalBody = replacePlaceholders(bodyHtml, replacements);

    // Add unsubscribe link if we have a dealroom
    if (dealroomId) {
      const unsubLink = `${baseUrl}/api/unsubscribe?id=${dealroomId}`;
      finalBody += `\n\n---\n<p style="font-size:11px;color:#999;">Falls Sie keine weiteren E-Mails wünschen: <a href="${unsubLink}">Abmelden</a></p>`;
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { error: sendError } = await resend.emails.send({
      from: `${fromName} <${fromDomain}>`,
      to: recipientEmail,
      subject: finalSubject,
      html: finalBody.replace(/\n/g, '<br>'),
    });

    if (sendError) {
      await serviceClient.from('email_flow_logs').insert({
        flow_id: null,
        dealroom_id: dealroomId || null,
        recipient_email: recipientEmail,
        subject: finalSubject,
        status: 'failed',
        skip_reason: sendError.message,
        source: 'manual',
      });
      console.error('Resend error:', sendError);
      return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 });
    }

    // Log as sent
    await serviceClient.from('email_flow_logs').insert({
      flow_id: null,
      dealroom_id: dealroomId || null,
      recipient_email: recipientEmail,
      subject: finalSubject,
      status: 'sent',
      source: 'manual',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
