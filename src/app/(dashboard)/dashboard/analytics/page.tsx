import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dealroom, TrackingEvent } from '@/types/database';
import { Eye, MousePointerClick, Video, FileSignature, TrendingUp, BarChart3, Users } from 'lucide-react';
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
    .select('id, slug, client_name, client_company, status')
    .eq('admin_id', user.id)
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

  // Per-dealroom stats
  const perDealroom = allDealrooms.map(dr => {
    const drEvents = allEvents.filter(e => e.dealroom_id === dr.id);
    const views = drEvents.filter(e => e.event_type === 'page_view').length;
    const videos = drEvents.filter(e => e.event_type === 'video_play').length;
    const ctas = drEvents.filter(e => e.event_type === 'cta_click').length;
    const signs = drEvents.filter(e => e.event_type === 'pandadoc_sign').length;
    const sessions = new Set(drEvents.map(e => e.session_id)).size;
    const lastEvent = drEvents[0]?.created_at;
    return { ...dr, views, videos, ctas, signs, sessions, lastEvent };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Analytics</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Überblick über alle Dealroom-Interaktionen
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <Eye className="h-5 w-5 text-[#11485e] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1a1a1a]">{totalViews}</p>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">Seitenaufrufe</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1a1a1a]">{uniqueSessions}</p>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">Sessions</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <Video className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1a1a1a]">{totalVideoPlays}</p>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">Video-Plays</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <MousePointerClick className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1a1a1a]">{totalCtaClicks}</p>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">CTA-Klicks</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3 text-center">
            <FileSignature className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#1a1a1a]">{totalSigns}</p>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">Unterschriften</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-[#11485e]/5 to-[#11485e]/10">
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="h-5 w-5 text-[#11485e] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#11485e]">{recentViews}</p>
            <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">Letzte 7 Tage</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Dealroom Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#11485e]" />
            Dealroom-Übersicht
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
                    <th className="pb-2 font-medium text-[#6b7280]">Dealroom</th>
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
