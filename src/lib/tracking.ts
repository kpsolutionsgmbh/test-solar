import { TrackingEventType } from '@/types/database';

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  return sessionId;
}

export function trackEvent(
  dealroomId: string,
  eventType: TrackingEventType,
  eventData?: Record<string, unknown>
) {
  const payload = {
    dealroom_id: dealroomId,
    event_type: eventType,
    event_data: eventData || null,
    session_id: getSessionId(),
  };

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', JSON.stringify(payload));
  } else {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

export function initDealroomTracking(dealroomId: string) {
  trackEvent(dealroomId, 'page_view');

  let maxScrollDepth = 0;
  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  const handleBeforeUnload = () => {
    trackEvent(dealroomId, 'scroll_depth', { max_depth: maxScrollDepth });
    trackEvent(dealroomId, 'session_end');
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}
