import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EmailFlow } from '@/types/database';
import { Metadata } from 'next';
import { EmailPageClient } from '@/components/dashboard/email-page-client';

export const metadata: Metadata = { title: 'E-Mails' };

export default async function EmailFlowsPage() {
  const supabase = createServerSupabaseClient();

  const { data: flows } = await supabase
    .from('email_flows')
    .select('*')
    .order('created_at', { ascending: true });

  const allFlows = (flows || []) as EmailFlow[];

  // Get last execution time per flow
  const flowIds = allFlows.map(f => f.id);
  const lastExecutions: Record<string, string> = {};
  if (flowIds.length > 0) {
    const { data: logs } = await supabase
      .from('email_flow_logs')
      .select('flow_id, sent_at')
      .in('flow_id', flowIds)
      .order('sent_at', { ascending: false });

    (logs || []).forEach((log: { flow_id: string; sent_at: string }) => {
      if (!lastExecutions[log.flow_id]) {
        lastExecutions[log.flow_id] = log.sent_at;
      }
    });
  }

  // Get all logs for history tab
  const { data: allLogs } = await supabase
    .from('email_flow_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100);

  // Get dealrooms for the composer (with customer + team member for preview)
  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select(`
      id, client_name, client_company, client_email, slug, status, assigned_member_id, customer_id,
      customers:customer_id (salutation, first_name, last_name, company),
      team_members:assigned_member_id (name, email, phone)
    `)
    .in('status', ['published', 'draft'])
    .order('updated_at', { ascending: false });

  // Get admin info for preview (first admin user)
  const { data: adminProfile } = await supabase
    .from('admin_users')
    .select('name, email')
    .limit(1)
    .single();

  // Normalize relation data (Supabase may return arrays for FK joins)
  const normalizedDealrooms = (dealrooms || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    client_name: d.client_name as string,
    client_company: d.client_company as string,
    client_email: d.client_email as string | null,
    slug: d.slug as string,
    status: d.status as string,
    customer_id: d.customer_id as string | null,
    assigned_member_id: d.assigned_member_id as string | null,
    customers: Array.isArray(d.customers) ? d.customers[0] || null : d.customers || null,
    team_members: Array.isArray(d.team_members) ? d.team_members[0] || null : d.team_members || null,
  }));

  return (
    <EmailPageClient
      flows={allFlows}
      lastExecutions={lastExecutions}
      logs={allLogs || []}
      dealrooms={normalizedDealrooms}
      adminProfile={adminProfile || undefined}
    />
  );
}
