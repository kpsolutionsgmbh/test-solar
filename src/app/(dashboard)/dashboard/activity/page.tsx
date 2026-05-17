import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ActivityFeedClient } from '@/components/dashboard/activity-feed-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Deal Intelligence' };

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const supabase = createServerSupabaseClient();

  // Last 30 days of events, joined with dealroom + customer info
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('id, client_name, client_company');

  const dealroomMap = new Map(
    (dealrooms || []).map(d => [d.id, { name: d.client_name, company: d.client_company }])
  );

  const { data: events } = await supabase
    .from('tracking_events')
    .select('id, dealroom_id, event_type, event_data, session_id, created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(500);

  const enriched = (events || []).map(e => {
    const dr = dealroomMap.get(e.dealroom_id);
    return {
      ...e,
      client_name: dr?.name || 'Unbekannt',
      client_company: dr?.company || '',
    };
  });

  return <ActivityFeedClient initialEvents={enriched} />;
}
