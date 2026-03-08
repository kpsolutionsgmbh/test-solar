import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { EmailFlow } from '@/types/database';
import { Mail, Clock } from 'lucide-react';
import { Metadata } from 'next';
import { EmailFlowSeedButton } from '@/components/dashboard/email-flow-seed-button';

export const metadata: Metadata = { title: 'E-Mail Flows' };

const triggerLabels: Record<string, string> = {
  manual: 'Wird manuell ausgelöst',
  not_opened: 'Kunde hat Dealroom nicht geöffnet',
  opened_not_offer: 'Geöffnet, aber Angebot nicht angesehen',
  offer_not_signed: 'Angebot angesehen, aber nicht unterschrieben',
  inactive: 'Keine Aktivität seit mehreren Tagen',
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Noch nie ausgeführt';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString('de-DE');
}

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
  let lastExecutions: Record<string, string> = {};
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">E-Mail Flows</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Automatische E-Mails die für Sie arbeiten
        </p>
      </div>

      {allFlows.length === 0 ? (
        <EmailFlowSeedButton />
      ) : (
        <div className="space-y-3">
          {allFlows.map((flow) => (
            <Link
              key={flow.id}
              href={`/dashboard/email-flows/${flow.id}`}
              className="block"
            >
              <Card className="group border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-150 hover:border-[#cfdde3] hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-[#e7eef1] flex items-center justify-center shrink-0">
                        <Mail size={16} className="text-[#11485e]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-[14px] font-semibold text-[#1a1a1a] truncate group-hover:text-[#11485e] transition-colors duration-75">
                            {flow.name}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                            flow.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-[#fafafa] text-[#6b7280] border-[#e5e7eb]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${flow.is_active ? 'bg-emerald-500' : 'bg-[#6b7280]'}`} />
                            {flow.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">
                          {flow.trigger_type === 'manual'
                            ? triggerLabels.manual
                            : `${flow.trigger_days} Tage – ${triggerLabels[flow.trigger_type]}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] shrink-0 ml-4">
                      <Clock size={13} strokeWidth={1.75} />
                      <span>{formatRelativeTime(lastExecutions[flow.id] || null)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
