'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackingEvent } from '@/types/database';
import {
  ArrowLeft,
  Eye,
  Clock,
  Play,
  CheckCircle2,
  MousePointerClick,
  ArrowUpDown,
  FileSignature,
  FileText,
  Monitor,
  Smartphone,
  Globe,
  Timer,
} from 'lucide-react';

const eventConfig: Record<string, { icon: React.ElementType; color: string; label: string; describe: (data: Record<string, unknown> | null) => string }> = {
  page_view: {
    icon: Eye,
    color: 'text-blue-600 bg-blue-100',
    label: 'Seite geöffnet',
    describe: () => 'hat den Dealroom geöffnet',
  },
  tab_switch: {
    icon: ArrowUpDown,
    color: 'text-indigo-600 bg-indigo-100',
    label: 'Tab gewechselt',
    describe: (data) => `hat zum Tab "${data?.tab || 'unbekannt'}" gewechselt`,
  },
  video_play: {
    icon: Play,
    color: 'text-purple-600 bg-purple-100',
    label: 'Video gestartet',
    describe: () => 'hat das Video gestartet',
  },
  video_complete: {
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-100',
    label: 'Video angesehen',
    describe: () => 'hat das Video vollständig angesehen',
  },
  pandadoc_open: {
    icon: FileText,
    color: 'text-amber-600 bg-amber-100',
    label: 'Angebot geöffnet',
    describe: () => 'hat das Angebot geöffnet',
  },
  pandadoc_sign: {
    icon: FileSignature,
    color: 'text-emerald-600 bg-emerald-100',
    label: 'Unterschrieben',
    describe: () => 'hat das Angebot unterschrieben!',
  },
  scroll_depth: {
    icon: Monitor,
    color: 'text-gray-600 bg-gray-100',
    label: 'Scroll-Tiefe',
    describe: (data) => `hat ${data?.depth || '?'}% der Seite gesehen`,
  },
  cta_click: {
    icon: MousePointerClick,
    color: 'text-rose-600 bg-rose-100',
    label: 'CTA geklickt',
    describe: () => 'hat den Call-to-Action Button geklickt',
  },
  session_end: {
    icon: Clock,
    color: 'text-gray-500 bg-gray-100',
    label: 'Session beendet',
    describe: (data) => {
      const dur = data?.duration as number | undefined;
      if (dur) {
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        return `Session beendet nach ${mins}:${String(secs).padStart(2, '0')} Min.`;
      }
      return 'hat die Seite verlassen';
    },
  },
};

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unbekannt', browser: '' };
  const isMobile = /mobile|android|iphone/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);
  let browser = 'Browser';
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';

  return {
    device: isTablet ? 'Tablet' : isMobile ? 'Mobil' : 'Desktop',
    browser,
  };
}

function groupBySession(events: TrackingEvent[]): Map<string, TrackingEvent[]> {
  const groups = new Map<string, TrackingEvent[]>();
  events.forEach((e) => {
    const existing = groups.get(e.session_id) || [];
    existing.push(e);
    groups.set(e.session_id, existing);
  });
  return groups;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

  if (diffDays === 0) return `Heute, ${formatTime(dateStr)}`;
  if (diffDays === 1) return `Gestern, ${formatTime(dateStr)}`;
  if (diffDays < 7) return `vor ${diffDays} Tagen, ${formatTime(dateStr)}`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + `, ${formatTime(dateStr)}`;
}

export default function ActivityPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealroomName, setDealroomName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: dealroom }, { data }] = await Promise.all([
        supabase.from('dealrooms').select('client_company, client_name').eq('id', params.id).single(),
        supabase.from('tracking_events').select('*').eq('dealroom_id', params.id).order('created_at', { ascending: false }),
      ]);

      if (dealroom) setDealroomName(`${dealroom.client_company} - ${dealroom.client_name}`);
      setEvents((data as TrackingEvent[]) || []);
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const sessions = groupBySession(events);
  const totalViews = events.filter((e) => e.event_type === 'page_view').length;
  const totalVideoPlays = events.filter((e) => e.event_type === 'video_play').length;
  const hasVideoWatch = events.some((e) => e.event_type === 'video_complete');
  const hasSigned = events.some((e) => e.event_type === 'pandadoc_sign');
  const ctaClicks = events.filter((e) => e.event_type === 'cta_click').length;

  // Engagement score (simple heuristic)
  let engagementScore = 0;
  if (totalViews > 0) engagementScore += 20;
  if (totalViews > 2) engagementScore += 10;
  if (totalVideoPlays > 0) engagementScore += 20;
  if (hasVideoWatch) engagementScore += 10;
  if (ctaClicks > 0) engagementScore += 20;
  if (hasSigned) engagementScore += 20;

  const engagementColor = engagementScore >= 70 ? 'text-emerald-600' : engagementScore >= 40 ? 'text-amber-600' : 'text-gray-400';

  return (
    <div>
      <button
        onClick={() => router.push(`/dashboard/dealrooms/${params.id}`)}
        className="flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </button>

      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-1">Aktivitäten</h1>
      <p className="text-sm text-[#6b7280] mb-6">{dealroomName}</p>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 pb-3 text-center">
                <Eye className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{totalViews}</p>
                <p className="text-[10px] text-[#6b7280] uppercase">Aufrufe</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 pb-3 text-center">
                <Globe className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{sessions.size}</p>
                <p className="text-[10px] text-[#6b7280] uppercase">Sessions</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 pb-3 text-center">
                <Play className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{totalVideoPlays}</p>
                <p className="text-[10px] text-[#6b7280] uppercase">Video-Plays</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 pb-3 text-center">
                <MousePointerClick className="h-4 w-4 text-rose-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{ctaClicks}</p>
                <p className="text-[10px] text-[#6b7280] uppercase">CTA-Klicks</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="pt-4 pb-3 text-center">
                <FileSignature className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-bold">
                  {hasSigned ? <span className="text-emerald-600">Ja</span> : <span className="text-[#d1d5db]">Nein</span>}
                </p>
                <p className="text-[10px] text-[#6b7280] uppercase">Signiert</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-gradient-to-br from-[#E97E1C]/5 to-[#E97E1C]/10">
              <CardContent className="pt-4 pb-3 text-center">
                <Timer className="h-4 w-4 text-[#E97E1C] mx-auto mb-1" />
                <p className={`text-xl font-bold ${engagementColor}`}>{engagementScore}%</p>
                <p className="text-[10px] text-[#6b7280] uppercase">Engagement</p>
              </CardContent>
            </Card>
          </div>

          {/* Session Timeline */}
          {events.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <Eye className="h-10 w-10 text-[#d1d5db] mx-auto mb-3" />
                <p className="text-[#6b7280] font-medium">Noch keine Aktivitäten</p>
                <p className="text-sm text-[#9ca3af] mt-1">Aktivitäten erscheinen hier sobald der Dealroom besucht wird</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Array.from(sessions.entries()).map(([sessionId, sessionEvents]) => {
                const firstEvent = sessionEvents[sessionEvents.length - 1];
                const lastEvent = sessionEvents[0];
                const startTime = new Date(firstEvent.created_at);
                const endTime = new Date(lastEvent.created_at);
                const durationSec = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000));
                const durationMin = Math.floor(durationSec / 60);
                const durationSecRem = durationSec % 60;
                const { device, browser } = parseUserAgent(firstEvent.user_agent);
                const DeviceIcon = device === 'Mobil' ? Smartphone : Monitor;

                // Session summary
                const sessionEventTypes = new Set(sessionEvents.map(e => e.event_type));
                const summaryParts: string[] = [];
                if (sessionEventTypes.has('video_play')) summaryParts.push('Video angesehen');
                if (sessionEventTypes.has('pandadoc_sign')) summaryParts.push('Unterschrieben');
                else if (sessionEventTypes.has('pandadoc_open')) summaryParts.push('Angebot geöffnet');
                if (sessionEventTypes.has('cta_click')) summaryParts.push('CTA geklickt');

                return (
                  <Card key={sessionId} className="overflow-hidden">
                    {/* Session header */}
                    <div className="px-5 py-3 bg-[#f8fafb] border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                          <DeviceIcon className="h-3.5 w-3.5" />
                          <span>{device}</span>
                          {browser && <span className="text-[#d1d5db]">/</span>}
                          {browser && <span>{browser}</span>}
                        </div>
                        <span className="text-[#e5e7eb]">|</span>
                        <span className="text-xs text-[#6b7280]">
                          {formatDateTime(firstEvent.created_at)}
                        </span>
                        <span className="text-[#e5e7eb]">|</span>
                        <span className="text-xs text-[#6b7280]">
                          {durationMin > 0 ? `${durationMin}:${String(durationSecRem).padStart(2, '0')} Min.` : `${durationSec}s`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {summaryParts.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Event list with timeline */}
                    <CardContent className="py-3">
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#e5e7eb]" />

                        <div className="space-y-0.5">
                          {sessionEvents.map((event) => {
                            const cfg = eventConfig[event.event_type] || {
                              icon: Eye,
                              color: 'text-gray-500 bg-gray-100',
                              label: event.event_type,
                              describe: () => event.event_type,
                            };
                            const Icon = cfg.icon;
                            const isHighlight = ['pandadoc_sign', 'cta_click', 'video_complete'].includes(event.event_type);

                            return (
                              <div
                                key={event.id}
                                className={`flex items-start gap-3 py-1.5 pl-0 relative ${isHighlight ? 'font-medium' : ''}`}
                              >
                                <div className={`h-[22px] w-[22px] rounded-full flex items-center justify-center shrink-0 relative z-10 ${cfg.color}`}>
                                  <Icon className="h-3 w-3" />
                                </div>
                                <div className="flex-1 flex items-center justify-between min-w-0">
                                  <span className={`text-sm ${isHighlight ? 'text-[#1a1a1a]' : 'text-[#374151]'}`}>
                                    {cfg.describe(event.event_data as Record<string, unknown> | null)}
                                  </span>
                                  <span className="text-[11px] text-[#9ca3af] shrink-0 ml-3 tabular-nums">
                                    {new Date(event.created_at).toLocaleTimeString('de-DE', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
