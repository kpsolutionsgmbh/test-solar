import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmailFlow } from '@/types/database';
import { Metadata } from 'next';
import { EmailPageClient } from '@/components/dashboard/email-page-client';

export const metadata: Metadata = { title: 'E-Mails' };

export default async function EmailFlowsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: flows } = await supabase
    .from('email_flows')
    .select('*')
    .eq('admin_id', user.id)
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

  // Get dealrooms for the composer
  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('id, client_name, client_company, client_email, slug, status')
    .eq('admin_id', user.id)
    .in('status', ['published', 'draft'])
    .order('updated_at', { ascending: false });

  return (
    <EmailPageClient
      flows={allFlows}
      lastExecutions={lastExecutions}
      logs={allLogs || []}
      dealrooms={dealrooms || []}
    />
  );
}
