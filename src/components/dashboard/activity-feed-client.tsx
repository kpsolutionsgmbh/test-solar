'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  PenLine,
  Eye,
  Play,
  FileSignature,
  MousePointerClick,
  Download,
  FileText,
  ArrowDown,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  dealroom_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  session_id: string | null;
  created_at: string;
  client_name: string;
  client_company: string;
}

type Priority = 'critical' | 'important' | 'normal';

const CRITICAL_EVENTS = new Set(['pandadoc_sign', 'document_download']);
const IMPORTANT_EVENTS = new Set(['cta_click', 'pandadoc_open', 'video_complete']);

function priorityOf(eventType: string, eventData: Record<string, unknown> | null): Priority {
  if (CRITICAL_EVENTS.has(eventType)) return 'critical';
  if (IMPORTANT_EVENTS.has(eventType)) return 'important';
  if (eventType === 'scroll_depth') {
    const depth = (eventData?.depth ?? eventData?.value) as number | undefined;
    if (depth && depth >= 75) return 'important';
  }
  return 'normal';
}

const EVENT_LABELS: Record<string, string> = {
  page_view: 'hat den Dealroom geöffnet',
  tab_switch: 'hat den Tab gewechselt',
  video_play: 'schaut das Video',
  video_complete: 'hat das Video angeschaut',
  pandadoc_open: 'sieht sich das Angebot an',
  pandadoc_sign: 'hat unterschrieben',
  cta_click: 'hat auf CTA geklickt',
  scroll_depth: 'scrollt durch die Seite',
  document_download: 'hat ein Dokument heruntergeladen',
  email_sent: 'E-Mail wurde gesendet',
};

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  page_view: Eye,
  tab_switch: PenLine,
  video_play: Play,
  video_complete: Play,
  pandadoc_open: FileText,
  pandadoc_sign: FileSignature,
  cta_click: MousePointerClick,
  scroll_depth: ArrowDown,
  document_download: Download,
};

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() || '')
    .join('') || '?';
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d}d`;
  return new Date(dateStr).toLocaleDateString('de-DE');
}

type Filter = 'all' | 'critical' | 'important' | 'normal';
type TimeRange = 'today' | '7d' | '30d';

export function ActivityFeedClient({ initialEvents }: { initialEvents: ActivityEvent[] }) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [filter, setFilter] = useState<Filter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const supabase = createClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('global-activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tracking_events' },
        async (payload) => {
          const event = payload.new as Omit<ActivityEvent, 'client_name' | 'client_company'>;
          const { data: dr } = await supabase
            .from('dealrooms')
            .select('client_name, client_company')
            .eq('id', event.dealroom_id)
            .single();
          const enriched: ActivityEvent = {
            ...event,
            client_name: dr?.client_name || 'Unbekannt',
            client_company: dr?.client_company || '',
          };
          setEvents(prev => [enriched, ...prev].slice(0, 500));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Unique customer list for filter
  const customerOptions = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach(e => {
      if (e.client_company) map.set(e.client_company, e.client_name);
    });
    return Array.from(map.entries()).map(([company, name]) => ({ company, name }));
  }, [events]);

  // Apply filters
  const filtered = useMemo(() => {
    const now = Date.now();
    const rangeMs =
      timeRange === 'today' ? 86400000 : timeRange === '7d' ? 7 * 86400000 : 30 * 86400000;
    return events.filter(e => {
      // Time range
      const age = now - new Date(e.created_at).getTime();
      if (age > rangeMs) return false;
      // Customer
      if (customerFilter && e.client_company !== customerFilter) return false;
      // Priority
      if (filter === 'all') return true;
      return priorityOf(e.event_type, e.event_data) === filter;
    });
  }, [events, filter, timeRange, customerFilter]);

  const handleFilterClick = useCallback((f: Filter) => setFilter(f), []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-500" />
          Deal Intelligence
        </h1>
        <p className="text-sm text-fg-muted mt-1">
          Was Ihre Kunden gerade tun. Über alle Angebotsräume hinweg, live.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1 shadow-raised">
          {(['all', 'critical', 'important', 'normal'] as Filter[]).map(f => {
            const labels: Record<Filter, string> = {
              all: 'Alle',
              critical: 'Kritisch',
              important: 'Wichtig',
              normal: 'Sonstige',
            };
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => handleFilterClick(f)}
                className={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors duration-fast ${
                  isActive
                    ? f === 'critical'
                      ? 'bg-danger-bg text-danger'
                      : 'bg-surface-sub text-fg'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        <div className="inline-flex rounded-lg border border-border bg-surface p-1 shadow-raised">
          {(['today', '7d', '30d'] as TimeRange[]).map(r => {
            const labels: Record<TimeRange, string> = { today: 'Heute', '7d': '7 Tage', '30d': '30 Tage' };
            const isActive = timeRange === r;
            return (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors duration-fast ${
                  isActive ? 'bg-surface-sub text-fg' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {customerOptions.length > 0 && (
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-body-sm text-fg shadow-raised"
          >
            <option value="">Alle Kunden</option>
            {customerOptions.map(o => (
              <option key={o.company} value={o.company}>
                {o.company} — {o.name}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto text-body-sm text-fg-muted tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'Event' : 'Events'}
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center shadow-raised">
          <Activity className="h-8 w-8 text-fg-subtle mx-auto mb-3" />
          <p className="text-body font-semibold text-fg mb-1">Noch keine Aktivität</p>
          <p className="text-body-sm text-fg-muted">
            Sobald ein Kunde einen Angebotsraum öffnet, erscheint hier ein Event.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map(event => {
            const priority = priorityOf(event.event_type, event.event_data);
            const Icon = EVENT_ICONS[event.event_type] || Activity;
            const isCritical = priority === 'critical';
            const isImportant = priority === 'important';
            return (
              <li key={event.id}>
                <Link
                  href={`/dashboard/dealrooms/${event.dealroom_id}/activity${event.session_id ? `?session=${event.session_id}` : ''}`}
                  className={`group flex items-start gap-3 sm:gap-4 rounded-lg border bg-surface px-4 py-3 transition-all duration-fast hover:shadow-floating ${
                    isCritical
                      ? 'border-l-4 border-l-danger border-y-border border-r-border'
                      : isImportant
                        ? 'border-l-4 border-l-brand-500 border-y-border border-r-border'
                        : 'border-border'
                  }`}
                >
                  {/* Avatar / Initials */}
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: isCritical ? 'hsl(var(--danger))' : 'hsl(var(--brand-500))' }}
                  >
                    {initials(event.client_name)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-fg leading-snug">
                      <span className="font-semibold">{event.client_name}</span>{' '}
                      <span className="text-fg-muted">{EVENT_LABELS[event.event_type] || event.event_type}</span>
                      {event.client_company && (
                        <span className="text-fg-subtle"> · {event.client_company}</span>
                      )}
                    </p>
                    <p className="text-micro text-fg-subtle mt-0.5">
                      {formatTimeAgo(event.created_at)}
                    </p>
                  </div>

                  {/* Icon + priority indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCritical && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-micro font-semibold bg-danger-bg text-danger">
                        <AlertCircle className="h-3 w-3" />
                        Kritisch
                      </span>
                    )}
                    <Icon className={`h-4 w-4 ${isCritical ? 'text-danger' : isImportant ? 'text-brand-500' : 'text-fg-subtle'}`} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
