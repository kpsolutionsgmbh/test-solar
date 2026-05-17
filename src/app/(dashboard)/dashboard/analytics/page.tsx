import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dealroom, TrackingEvent } from '@/types/database';
import { BarChart3, Flame } from 'lucide-react';
import { AnalyticsStatsGrid } from '@/components/dashboard/analytics-stats';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Auswertung' };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient();

  const { data: dealrooms } = await supabase
    .from('dealrooms')
    .select('id, slug, client_name, client_company, status, engagement_score, created_at')
    .order('updated_at', { ascending: false });

  const allDealrooms = (dealrooms || []) as (Dealroom & { engagement_score?: number; created_at?: string })[];
  const dealroomIds = allDealrooms.map(d => d.id);

  const { data: events } = dealroomIds.length > 0
    ? await supabase
        .from('tracking_events')
        .select('dealroom_id, event_type, session_id, created_at')
        .in('dealroom_id', dealroomIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const allEvents = (events || []) as TrackingEvent[];

  // Compute funnel metrics — counting unique dealrooms that reached each stage
  const dealroomsByEventType = (eventType: string) =>
    new Set(allEvents.filter(e => e.event_type === eventType).map(e => e.dealroom_id));

  const totalDealrooms = allDealrooms.length;
  const openedDealrooms = dealroomsByEventType('page_view').size;
  const videoDealrooms = dealroomsByEventType('video_play').size;
  const ctaDealrooms = dealroomsByEventType('cta_click').size;
  const signedDealrooms = allDealrooms.filter(d => d.status === 'signed').length || dealroomsByEventType('pandadoc_sign').size;

  const conversionRate = totalDealrooms > 0 ? Math.round((signedDealrooms / totalDealrooms) * 100) : 0;
  const avgEngagement = totalDealrooms > 0
    ? Math.round(allDealrooms.reduce((sum, d) => sum + (d.engagement_score || 0), 0) / totalDealrooms)
    : 0;

  // 7-day window
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const fourteenDaysAgo = now - 14 * 86400000;
  const sessionsLast7 = new Set(
    allEvents
      .filter(e => e.event_type === 'page_view' && new Date(e.created_at).getTime() > sevenDaysAgo)
      .map(e => e.session_id)
  ).size;
  const sessionsPrev7 = new Set(
    allEvents
      .filter(
        e =>
          e.event_type === 'page_view' &&
          new Date(e.created_at).getTime() > fourteenDaysAgo &&
          new Date(e.created_at).getTime() <= sevenDaysAgo
      )
      .map(e => e.session_id)
  ).size;
  const recentOpensDelta = sessionsPrev7 > 0
    ? Math.round(((sessionsLast7 - sessionsPrev7) / sessionsPrev7) * 100)
    : null;

  // Funnel stages
  const funnelStages = [
    { label: 'Erstellt', count: totalDealrooms, color: 'bg-fg' },
    { label: 'Geöffnet', count: openedDealrooms, color: 'bg-brand-500' },
    { label: 'Video', count: videoDealrooms, color: 'bg-brand-500/80' },
    { label: 'CTA', count: ctaDealrooms, color: 'bg-brand-500/60' },
    { label: 'Signiert', count: signedDealrooms, color: 'bg-success' },
  ];
  const maxFunnel = Math.max(...funnelStages.map(s => s.count), 1);

  // Score distribution
  const scoreCategories = [
    { label: 'Kalt (0-20)', min: 0, max: 20, color: 'bg-fg-subtle' },
    { label: 'Lauwarm (21-40)', min: 21, max: 40, color: 'bg-info' },
    { label: 'Warm (41-60)', min: 41, max: 60, color: 'bg-brand-500' },
    { label: 'Heiß (61-80)', min: 61, max: 80, color: 'bg-danger' },
    { label: 'Deal-Ready (81+)', min: 81, max: 100, color: 'bg-success' },
  ];
  const scoreCounts = scoreCategories.map(cat => ({
    ...cat,
    count: allDealrooms.filter(d => {
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
    const score = dr.engagement_score || 0;
    return { ...dr, views, videos, ctas, signs, sessions, lastEvent, score };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg">Auswertung</h1>
        <p className="text-sm text-fg-muted mt-1">
          Wie Ihre Kunden mit den Angebotsräumen interagieren.
        </p>
      </div>

      {/* Global KPI Strip */}
      <AnalyticsStatsGrid
        totalDealrooms={totalDealrooms}
        totalOpened={openedDealrooms}
        totalSigns={signedDealrooms}
        conversionRate={conversionRate}
        avgEngagement={avgEngagement}
        recentOpens={sessionsLast7}
        recentOpensDelta={recentOpensDelta}
      />

      {/* Funnel */}
      <Card className="mb-6 border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-500" />
            Dealroom-Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {funnelStages.map((stage, i) => {
              const pct = totalDealrooms > 0 ? Math.round((stage.count / totalDealrooms) * 100) : 0;
              const dropoff = i > 0 ? funnelStages[i - 1].count - stage.count : null;
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="text-body-sm text-fg w-24 shrink-0">{stage.label}</span>
                  <div className="flex-1 h-7 bg-surface-sub rounded-md overflow-hidden relative">
                    <div
                      className={`h-full rounded-md ${stage.color} transition-all duration-500`}
                      style={{ width: `${(stage.count / maxFunnel) * 100}%` }}
                    />
                  </div>
                  <span className="text-body-sm font-semibold text-fg w-10 text-right tabular-nums">{stage.count}</span>
                  <span className="text-micro text-fg-subtle w-12 text-right tabular-nums">{pct}%</span>
                  {dropoff != null && dropoff > 0 ? (
                    <span className="text-micro text-danger w-14 text-right tabular-nums">−{dropoff}</span>
                  ) : (
                    <span className="w-14" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Score Distribution */}
      <Card className="mb-6 border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand-500" />
            Engagement-Score Verteilung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scoreCounts.map((cat) => (
              <div key={cat.label} className="flex items-center gap-3">
                <span className="text-body-sm text-fg-muted w-32 shrink-0">{cat.label}</span>
                <div className="flex-1 h-5 bg-surface-sub rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                    style={{ width: `${(cat.count / maxScoreCount) * 100}%`, minWidth: cat.count > 0 ? '20px' : '0' }}
                  />
                </div>
                <span className="text-body-sm font-semibold text-fg w-6 text-right tabular-nums">{cat.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-Dealroom Table — link goes to ACTIVITY page */}
      <Card className="border-border shadow-raised">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-500" />
            Angebotsraum-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perDealroom.length === 0 ? (
            <p className="text-sm text-fg-muted py-8 text-center">Noch keine Daten vorhanden</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-fg-muted">Angebotsraum</th>
                    <th className="pb-2 font-medium text-fg-muted text-center">Score</th>
                    <th className="pb-2 font-medium text-fg-muted text-center">Status</th>
                    <th className="pb-2 font-medium text-fg-muted text-center">Views</th>
                    <th className="pb-2 font-medium text-fg-muted text-center">Sessions</th>
                    <th className="pb-2 font-medium text-fg-muted text-center">Video</th>
                    <th className="pb-2 font-medium text-fg-muted text-center">CTA</th>
                    <th className="pb-2 font-medium text-fg-muted text-center">Signiert</th>
                    <th className="pb-2 font-medium text-fg-muted text-right">Letzte Aktivität</th>
                  </tr>
                </thead>
                <tbody>
                  {perDealroom.map(dr => {
                    const statusColors: Record<string, string> = {
                      draft: 'bg-warning-bg text-warning',
                      published: 'bg-success-bg text-success',
                      signed: 'bg-info-bg text-info',
                      inactive: 'bg-warning-bg text-warning',
                      archived: 'bg-surface-sub text-fg-subtle',
                    };
                    const statusLabels: Record<string, string> = { draft: 'Entwurf', published: 'Live', signed: 'Signiert', inactive: 'Inaktiv', archived: 'Archiv' };
                    return (
                      <tr key={dr.id} className="border-b border-border last:border-0 hover:bg-surface-sub transition-colors duration-fast">
                        <td className="py-3">
                          <Link
                            href={`/dashboard/dealrooms/${dr.id}/activity`}
                            className="block hover:text-brand-500 transition-colors duration-fast"
                          >
                            <p className="font-semibold text-fg">{dr.client_company}</p>
                            <p className="text-xs text-fg-muted">{dr.client_name}</p>
                          </Link>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`tabular-nums text-xs font-semibold ${
                            dr.score >= 81 ? 'text-success' :
                            dr.score >= 61 ? 'text-danger' :
                            dr.score >= 41 ? 'text-brand-500' :
                            dr.score >= 21 ? 'text-info' : 'text-fg-subtle'
                          }`}>{dr.score}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[dr.status]}`}>
                            {statusLabels[dr.status]}
                          </span>
                        </td>
                        <td className="py-3 text-center tabular-nums text-fg-muted">{dr.views}</td>
                        <td className="py-3 text-center tabular-nums text-fg-muted">{dr.sessions}</td>
                        <td className="py-3 text-center tabular-nums text-fg-muted">{dr.videos}</td>
                        <td className="py-3 text-center tabular-nums text-fg-muted">{dr.ctas}</td>
                        <td className="py-3 text-center tabular-nums">
                          {dr.signs > 0 ? (
                            <span className="text-success font-semibold">{dr.signs}</span>
                          ) : (
                            <span className="text-fg-subtle">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-xs text-fg-muted">
                          {dr.lastEvent ? (
                            <>
                              {formatDate(dr.lastEvent)}
                              <span className="text-fg-subtle ml-1">({daysAgo(dr.lastEvent)}d)</span>
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
