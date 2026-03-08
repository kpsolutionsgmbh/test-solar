import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { EmailFlow } from '@/types/database';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface EligibleDealroom {
  id: string;
  client_email: string;
  client_name: string;
  client_company: string;
  slug: string;
  status: string;
  customer_id: string | null;
}

export async function GET(req: NextRequest) {
  // Auth: Only Vercel Cron or CRON_SECRET should call this
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Load all active non-manual flows
  const { data: flows, error: flowsError } = await supabase
    .from('email_flows')
    .select('*')
    .eq('is_active', true)
    .neq('trigger_type', 'manual');

  if (flowsError || !flows) {
    return NextResponse.json({ error: flowsError?.message || 'No flows' }, { status: 500 });
  }

  const resend = getResend();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dealroom-app.vercel.app';
  let totalSent = 0;
  let totalSkipped = 0;

  for (const flow of flows as EmailFlow[]) {
    // Check weekend rule
    if (flow.skip_weekends) {
      const dayOfWeek = new Date().getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    }

    // Find eligible dealrooms via RPC
    let rpcName = '';
    switch (flow.trigger_type) {
      case 'not_opened': rpcName = 'get_dealrooms_not_opened'; break;
      case 'opened_not_offer': rpcName = 'get_dealrooms_opened_not_offer'; break;
      case 'offer_not_signed': rpcName = 'get_dealrooms_offer_not_signed'; break;
      case 'inactive': rpcName = 'get_dealrooms_inactive'; break;
      default: continue;
    }

    const { data: eligible } = await supabase.rpc(rpcName, {
      p_admin_id: flow.admin_id,
      p_days_ago: flow.trigger_days,
    });

    if (!eligible || eligible.length === 0) continue;

    for (const dealroom of eligible as EligibleDealroom[]) {
      if (!dealroom.client_email) continue;

      // Check if already sent (max_sends)
      const { count } = await supabase
        .from('email_flow_logs')
        .select('id', { count: 'exact', head: true })
        .eq('flow_id', flow.id)
        .eq('dealroom_id', dealroom.id)
        .neq('status', 'skipped');

      if ((count || 0) >= flow.max_sends) {
        totalSkipped++;
        continue;
      }

      // Skip if signed
      if (flow.skip_if_signed && dealroom.status === 'signed') {
        await logFlowExecution(supabase, flow.id, dealroom.id, dealroom.client_email, '', 'skipped', 'Bereits unterschrieben');
        totalSkipped++;
        continue;
      }

      // Skip if inactive/archived
      if (flow.skip_if_inactive && (dealroom.status === 'inactive' || dealroom.status === 'archived')) {
        await logFlowExecution(supabase, flow.id, dealroom.id, dealroom.client_email, '', 'skipped', 'Dealroom inaktiv');
        totalSkipped++;
        continue;
      }

      // Get customer + team member data for personalization
      let customerData: Record<string, string> = {};
      if (dealroom.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('salutation, first_name, last_name, company')
          .eq('id', dealroom.customer_id)
          .single();

        if (customer) {
          customerData = {
            anrede: customer.salutation || '',
            vorname: customer.first_name || '',
            nachname: customer.last_name || '',
            firma: customer.company || dealroom.client_company,
          };
        }
      }

      // Fallback from dealroom data
      if (!customerData.nachname) {
        const nameParts = dealroom.client_name.split(' ');
        customerData = {
          anrede: '',
          vorname: nameParts[0] || '',
          nachname: nameParts.slice(1).join(' ') || '',
          firma: dealroom.client_company,
        };
      }

      // Get assigned team member
      const { data: admin } = await supabase
        .from('admin_users')
        .select('name, email')
        .eq('id', flow.admin_id)
        .single();

      const dealroomUrl = `${baseUrl}/d/${dealroom.slug}?utm_source=reminder&utm_medium=email&utm_campaign=flow_${flow.id}`;
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?id=${dealroom.id}`;

      // Replace placeholders
      const replacements: Record<string, string> = {
        '{{anrede}}': customerData.anrede,
        '{{vorname}}': customerData.vorname,
        '{{nachname}}': customerData.nachname,
        '{{firma}}': customerData.firma,
        '{{produkt}}': '',
        '{{ansprechpartner_name}}': admin?.name || '',
        '{{ansprechpartner_telefon}}': '',
        '{{ansprechpartner_email}}': admin?.email || '',
        '{{dealroom_link}}': dealroomUrl,
        '{{r}}': customerData.anrede === 'Herr' ? 'r' : '',
      };

      let emailSubject = flow.subject_template;
      let emailBody = flow.body_template;

      for (const [placeholder, value] of Object.entries(replacements)) {
        emailSubject = emailSubject.replaceAll(placeholder, value);
        emailBody = emailBody.replaceAll(placeholder, value);
      }

      // Build HTML
      const htmlBody = buildFlowEmailHtml(emailBody, dealroomUrl, unsubscribeUrl, baseUrl);

      // Send
      try {
        if (resend) {
          await resend.emails.send({
            from: 'Gündesli & Kollegen <onboarding@resend.dev>',
            to: dealroom.client_email,
            subject: emailSubject,
            html: htmlBody,
          });
        } else {
          console.log('[CRON] Would send email to:', dealroom.client_email, 'Subject:', emailSubject);
        }

        await logFlowExecution(supabase, flow.id, dealroom.id, dealroom.client_email, emailSubject, 'sent');
        totalSent++;
      } catch (error) {
        console.error('[CRON] Email send error:', error);
        await logFlowExecution(supabase, flow.id, dealroom.id, dealroom.client_email, emailSubject, 'failed');
      }
    }
  }

  return NextResponse.json({ success: true, sent: totalSent, skipped: totalSkipped });
}

async function logFlowExecution(
  supabase: ReturnType<typeof createServiceRoleClient>,
  flowId: string,
  dealroomId: string,
  recipientEmail: string,
  subject: string,
  status: string,
  skipReason?: string,
) {
  await supabase.from('email_flow_logs').insert({
    flow_id: flowId,
    dealroom_id: dealroomId,
    recipient_email: recipientEmail,
    subject,
    status,
    skip_reason: skipReason || null,
  });
}

function buildFlowEmailHtml(body: string, dealroomUrl: string, unsubscribeUrl: string, baseUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
      <div style="margin-bottom: 32px;">
        <img src="${baseUrl}/images/logo-blue.svg" alt="Gündesli & Kollegen" style="height: 28px;" />
      </div>
      <div style="white-space: pre-line; font-size: 15px; line-height: 1.6; color: #374151;">
        ${body.replace(/\n/g, '<br/>')}
      </div>
      <div style="margin-top: 32px; text-align: center;">
        <a href="${dealroomUrl}" style="display: inline-block; padding: 14px 32px; background-color: #11485e; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Jetzt Angebot ansehen
        </a>
      </div>
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        Gündesli und Kollegen GmbH · Vollmerhauser Straße 47, Gummersbach<br/>
        Bezirksdirektion der SIGNAL IDUNA Gruppe
      </div>
      <p style="font-size: 11px; color: #999; margin-top: 32px; text-align: center;">
        Sie erhalten diese E-Mail weil Ihnen ein persönliches Angebot
        von Gündesli &amp; Kollegen zugesendet wurde.
        <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Keine weiteren Erinnerungen</a>
      </p>
    </div>
  `;
}
