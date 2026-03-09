import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dealroom, TrackingEvent } from '@/types/database';
import { BarChart3, Flame } from 'lucide-react';
import { AnalyticsStatsGrid } from '@/components/dashboard/analytics-stats';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics' };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('id, slug, client_name, client_company, status, engagement_score')
    .order('updated_at', { ascending: false });

  const allDealrooms = (dealrooms || []) as Dealroom[];
  const dealroomIds = allDealrooms.map(d => d.id);

  const { data: events } = dealroomIds.length > 0
    ? await supabase
        .from('tracking_events')
        .select('dealroom_id, event_type, session_id, created_at')
        .in('dealroom_id', dealroomIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const allEvents = (events || []) as TrackingEvent[];

  // Compute stats
  const totalViews = allEvents.filter(e => e.event_type === 'page_view').length;
  const totalVideoPlays = allEvents.filter(e => e.event_type === 'video_play').length;
  const totalCtaClicks = allEvents.filter(e => e.event_type === 'cta_click').length;
  const totalSigns = allEvents.filter(e => e.event_type === 'pandadoc_sign').length;
  const uniqueSessions = new Set(allEvents.map(e => e.session_id)).size;

  // Last 7 days events
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recentEvents = allEvents.filter(e => new Date(e.created_at).getTime() > sevenDaysAgo);
  const recentViews = recentEvents.filter(e => e.event_type === 'page_view').length;

  // Score distribution
  const scoreCategories = [
    { label: 'Kalt (0-20)', min: 0, max: 20, color: 'bg-gray-400' },
    { label: 'Lauwarm (21-40)', min: 21, max: 40, color: 'bg-blue-400' },
    { label: 'Warm (41-60)', min: 41, max: 60, color: 'bg-orange-400' },
    { label: 'Heiß (61-80)', min: 61, max: 80, color: 'bg-red-500' },
    { label: 'Deal-Ready (81+)', min: 81, max: 100, color: 'bg-emerald-500' },
  ];
  const scoreCounts = scoreCategories.map(cat => ({
    ...cat,
    count: allDealrooms.filter((d: { engagement_score?: number }) => {
      const s = d.engagement_score || 0;
      return s >= cat.min && s <= cat.max;
    }).length,
  }));
  const maxScoreCount = Math.max(...scoreCounts.map(c => c.count), 1);

  // Per-dealroom stats
  const perDealroom = allDealrooms.map(dr => {
    const drEvents = allEvents.filter(e => e.dealroom_id === dr.id);
    const views = drEvents.filter(e => e.event_type === 'page_view').length;
    const videos = drEvents.filter(e => e.event_type === 'video_play').length;
    const ctas = drEvents.filter(e => e.event_type === 'cta_click').length;
    const signs = drEvents.filter(e => e.event_type === 'pandadoc_sign').length;
    const sessions = new Set(drEvents.map(e => e.session_id)).size;
    const lastEvent = drEvents[0]?.created_at;
    const score = (dr as Dealroom & { engagement_score?: number }).engagement_score || 0;
    return { ...dr, views, videos, ctas, signs, sessions, lastEvent, score };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Auswertungen</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Wie Ihre Kunden mit den Angebotsräumen interagieren.
        </p>
      </div>

      {/* Global Stats */}
      <AnalyticsStatsGrid
        totalViews={totalViews}
        uniqueSessions={uniqueSessions}
        totalVideoPlays={totalVideoPlays}
        totalCtaClicks={totalCtaClicks}
        totalSigns={totalSigns}
        recentViews={recentViews}
      />

      {/* Engagement Score Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#11485e]" />
            Engagement Score Verteilung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scoreCounts.map((cat) => (
              <div key={cat.label} className="flex items-center gap-3">
                <span className="text-xs text-[#6b7280] w-32 shrink-0">{cat.label}</span>
                <div className="flex-1 h-5 bg-[#f3f4f6] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                    style={{ width: `${(cat.count / maxScoreCount) * 100}%`, minWidth: cat.count > 0 ? '20px' : '0' }}
                  />
                </div>
                <span className="text-xs font-semibold text-[#1a1a1a] w-6 text-right tabular-nums">{cat.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-Dealroom Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#11485e]" />
            Angebotsraum-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perDealroom.length === 0 ? (
            <p className="text-sm text-[#6b7280] py-8 text-center">Noch keine Daten vorhanden</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-[#6b7280]">Angebotsraum</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-center">Score</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-center">Status</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-center">Views</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-center">Sessions</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-center">Video</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-center">CTA</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-center">Signiert</th>
                    <th className="pb-2 font-medium text-[#6b7280] text-right">Letzte Aktivität</th>
                  </tr>
                </thead>
                <tbody>
                  {perDealroom.map(dr => {
                    const statusColors: Record<string, string> = {
                      draft: 'bg-amber-100 text-amber-700',
                      published: 'bg-emerald-100 text-emerald-700',
                      signed: 'bg-blue-100 text-blue-700',
                      inactive: 'bg-orange-100 text-orange-700',
                      archived: 'bg-gray-100 text-gray-500',
                    };
                    const statusLabels: Record<string, string> = { draft: 'Entwurf', published: 'Live', signed: 'Signiert', inactive: 'Inaktiv', archived: 'Archiv' };
                    return (
                      <tr key={dr.id} className="border-b last:border-0 hover:bg-[#fafafa]">
                        <td className="py-3">
                          <Link href={`/dashboard/dealrooms/${dr.id}`} className="hover:text-[#11485e] transition-colors">
                            <p className="font-medium text-[#1a1a1a]">{dr.client_company}</p>
                            <p className="text-xs text-[#6b7280]">{dr.client_name}</p>
                          </Link>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`tabular-nums text-xs font-semibold ${
                            dr.score >= 81 ? 'text-emerald-600' :
                            dr.score >= 61 ? 'text-red-500' :
                            dr.score >= 41 ? 'text-orange-500' :
                            dr.score >= 21 ? 'text-blue-500' : 'text-gray-400'
                          }`}>{dr.score}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[dr.status]}`}>
                            {statusLabels[dr.status]}
                          </span>
                        </td>
                        <td className="py-3 text-center tabular-nums">{dr.views}</td>
                        <td className="py-3 text-center tabular-nums">{dr.sessions}</td>
                        <td className="py-3 text-center tabular-nums">{dr.videos}</td>
                        <td className="py-3 text-center tabular-nums">{dr.ctas}</td>
                        <td className="py-3 text-center tabular-nums">
                          {dr.signs > 0 ? (
                            <span className="text-emerald-600 font-medium">{dr.signs}</span>
                          ) : (
                            <span className="text-[#d1d5db]">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-xs text-[#6b7280]">
                          {dr.lastEvent ? (
                            <>
                              {formatDate(dr.lastEvent)}
                              <span className="text-[#d1d5db] ml-1">({daysAgo(dr.lastEvent)}d)</span>
                            </>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
