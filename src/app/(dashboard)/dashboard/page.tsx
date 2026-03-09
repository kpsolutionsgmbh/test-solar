import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dealroom } from '@/types/database';
import { DealroomList } from '@/components/dashboard/dealroom-list';
import { StatsGrid } from '@/components/dashboard/stats-cards';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('id, slug, client_name, client_company, client_position, status, language, updated_at, published_at, created_at, engagement_score')
    .order('updated_at', { ascending: false });

  const allDealrooms = (dealrooms || []) as Dealroom[];
  const dealroomIds = allDealrooms.map(d => d.id);
  const { data: trackingCounts } = dealroomIds.length > 0
    ? await supabase
        .from('tracking_events')
        .select('dealroom_id')
        .in('dealroom_id', dealroomIds)
    : { data: [] };

  const viewCounts: Record<string, number> = {};
  (trackingCounts || []).forEach((t: { dealroom_id: string }) => {
    viewCounts[t.dealroom_id] = (viewCounts[t.dealroom_id] || 0) + 1;
  });

  const engagementScores: Record<string, number> = {};
  allDealrooms.forEach((d: Dealroom & { engagement_score?: number }) => {
    engagementScores[d.id] = d.engagement_score || 0;
  });

  const totalViews = Object.values(viewCounts).reduce((a, b) => a + b, 0);
  const publishedCount = allDealrooms.filter(d => d.status === 'published').length;
  const draftCount = allDealrooms.filter(d => d.status === 'draft').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Übersicht</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Alle Ihre Angebotsräume auf einen Blick.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-sm">
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Angebotsraum
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        total={allDealrooms.length}
        published={publishedCount}
        drafts={draftCount}
        interactions={totalViews}
      />

      {/* Dealroom List */}
      <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Alle Angebotsräume</h2>
      <DealroomList dealrooms={allDealrooms} viewCounts={viewCounts} engagementScores={engagementScores} />
    </div>
  );
}
