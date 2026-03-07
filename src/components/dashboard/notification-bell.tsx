'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';

interface TrackingNotification {
  id: string;
  dealroom_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
  // Joined data
  client_company?: string;
  client_name?: string;
}

const eventLabels: Record<string, string> = {
  page_view: 'hat den Dealroom geöffnet',
  tab_switch: 'hat den Tab gewechselt',
  video_play: 'schaut das Video',
  video_complete: 'hat das Video angeschaut',
  pandadoc_open: 'sieht sich das Angebot an',
  pandadoc_sign: 'hat unterschrieben! 🎉',
  cta_click: 'hat auf CTA geklickt',
  scroll_depth: 'scrollt durch die Seite',
  document_download: 'hat ein Dokument heruntergeladen',
  email_sent: 'E-Mail wurde gesendet',
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  return date.toLocaleDateString('de-DE');
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<TrackingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const supabase = createClient();

  // Fetch recent events on mount
  const fetchRecent = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get recent tracking events for this admin's dealrooms
    const { data: dealrooms } = await supabase
      .from('dealrooms')
      .select('id, client_company, client_name')
      .eq('admin_id', user.id);

    if (!dealrooms?.length) return;

    const dealroomMap = new Map(dealrooms.map(d => [d.id, d]));
    const dealroomIds = dealrooms.map(d => d.id);

    const { data: events } = await supabase
      .from('tracking_events')
      .select('*')
      .in('dealroom_id', dealroomIds)
      .in('event_type', ['page_view', 'pandadoc_sign', 'pandadoc_open', 'video_play', 'cta_click', 'document_download'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (events) {
      const enriched = events.map(e => ({
        ...e,
        client_company: dealroomMap.get(e.dealroom_id)?.client_company,
        client_name: dealroomMap.get(e.dealroom_id)?.client_name,
      }));
      setNotifications(enriched);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tracking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
        },
        async (payload) => {
          const event = payload.new as TrackingNotification;
          // Only show important events
          const importantEvents = ['page_view', 'pandadoc_sign', 'pandadoc_open', 'video_play', 'cta_click', 'document_download'];
          if (!importantEvents.includes(event.event_type)) return;

          // Fetch dealroom info for context
          const { data: dealroom } = await supabase
            .from('dealrooms')
            .select('client_company, client_name')
            .eq('id', event.dealroom_id)
            .single();

          const enriched = {
            ...event,
            client_company: dealroom?.client_company,
            client_name: dealroom?.client_name,
          };

          setNotifications(prev => [enriched, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);

          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(`${dealroom?.client_company || 'Kunde'}`, {
              body: eventLabels[event.event_type] || event.event_type,
              icon: '/images/logo-blue.svg',
            });
          }
        }
      )
      .subscribe();

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) setUnreadCount(0);
        }}
        className="relative h-8 w-8 flex items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-colors"
      >
        <Bell size={16} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

          {/* Dropdown */}
          <div className="absolute left-full ml-2 top-0 w-80 bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-50 max-h-[400px] overflow-y-auto">
            <div className="px-4 py-3 border-b border-[#e5e7eb]">
              <p className="text-sm font-semibold text-[#1a1a1a]">Benachrichtigungen</p>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-[#d1d5db]" />
                <p className="text-sm text-[#6b7280]">Keine Aktivitäten</p>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0f0]">
                {notifications.map((n, i) => (
                  <div key={`${n.id}-${i}`} className="px-4 py-3 hover:bg-[#fafafa] transition-colors">
                    <p className="text-[13px] text-[#1a1a1a]">
                      <span className="font-semibold">{n.client_company || 'Unbekannt'}</span>{' '}
                      <span className="text-[#6b7280]">{eventLabels[n.event_type] || n.event_type}</span>
                    </p>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">{formatTime(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
