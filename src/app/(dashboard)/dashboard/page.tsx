import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileX, Send, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dealroom } from '@/types/database';
import { DealroomList } from '@/components/dashboard/dealroom-list';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('id, slug, client_name, client_company, client_position, status, language, updated_at, published_at, created_at, engagement_score')
    .eq('admin_id', user.id)
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
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Dashboard</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Verwalten Sie Ihre Dealrooms und Kundeninteraktionen
          </p>
        </div>
        <Button asChild size="lg" className="shadow-sm">
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Dealroom
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-none shadow-sm bg-gradient-to-br from-[#11485e]/5 to-[#11485e]/10">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Gesamt</p>
                <p className="text-3xl font-bold text-[#11485e] mt-1">
                  {allDealrooms.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#11485e]/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#11485e]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Live</p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">{publishedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Entwürfe</p>
                <p className="text-3xl font-bold text-amber-700 mt-1">{draftCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileX className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Interaktionen</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{totalViews}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dealroom List */}
      <h2 className="text-lg font-semibold text-[#1a1a1a] mb-4">Alle Dealrooms</h2>
      <DealroomList dealrooms={allDealrooms} viewCounts={viewCounts} engagementScores={engagementScores} />
    </div>
  );
}
