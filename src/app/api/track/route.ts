import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Must stay in sync with TrackingEventType in src/types/database.ts
const ALLOWED_EVENTS = new Set([
  'page_view',
  'tab_switch',
  'video_play',
  'video_complete',
  'pandadoc_open',
  'pandadoc_sign',
  'scroll_depth',
  'cta_click',
  'session_end',
  'document_download',
  'email_sent',
]);

// Per-instance rate limiting. Best-effort: resets on cold start, doesn't sync
// across Lambda instances. For real abuse protection upgrade to Upstash KV
// or Vercel KV, but in practice this stops 99% of spam patterns since one
// instance handles a burst from a single attacker.
const SESSION_LIMIT = 120; // events per minute per (dealroom_id + session_id)
const IP_LIMIT = 600; // events per minute per IP
const WINDOW_MS = 60_000;

type Bucket = { count: number; resetAt: number };
const sessionBuckets = new Map<string, Bucket>();
const ipBuckets = new Map<string, Bucket>();

function check(map: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now();
  const b = map.get(key);
  if (!b || b.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

// Periodically prune to keep memory bounded. Runs lazily on each call.
let lastPrune = 0;
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  sessionBuckets.forEach((v, k) => {
    if (v.resetAt < now) sessionBuckets.delete(k);
  });
  ipBuckets.forEach((v, k) => {
    if (v.resetAt < now) ipBuckets.delete(k);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealroom_id, event_type, event_data, session_id } = body;

    if (!dealroom_id || !event_type || !session_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (typeof dealroom_id !== 'string' || !UUID_REGEX.test(dealroom_id)) {
      return NextResponse.json({ error: 'Invalid dealroom id' }, { status: 400 });
    }

    if (!ALLOWED_EVENTS.has(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    if (typeof session_id !== 'string' || session_id.length > 128) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
    }

    // Anonymize IP (remove last octet)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const anonymizedIp = ip.split('.').slice(0, 3).join('.') + '.0';

    const userAgent = request.headers.get('user-agent') || null;

    // Filter out bots and crawlers
    if (userAgent) {
      const botPatterns = /bot|crawler|spider|scraper|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|preview|headless|phantom|selenium/i;
      if (botPatterns.test(userAgent)) {
        return NextResponse.json({ ok: true });
      }
    }

    // Rate limit. Silently drop over-limit pings (return 200 so the client
    // beacon doesn't retry storm). Only log when we drop.
    maybePrune();
    const sessionKey = `${dealroom_id}:${session_id}`;
    if (!check(sessionBuckets, sessionKey, SESSION_LIMIT)) {
      return NextResponse.json({ ok: true, dropped: 'session-rate-limit' });
    }
    if (!check(ipBuckets, ip, IP_LIMIT)) {
      return NextResponse.json({ ok: true, dropped: 'ip-rate-limit' });
    }

    const supabase = createServiceRoleClient();

    await supabase.from('tracking_events').insert({
      dealroom_id,
      event_type,
      event_data: event_data || null,
      visitor_ip: anonymizedIp,
      user_agent: userAgent,
      session_id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
