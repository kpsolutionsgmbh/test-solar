import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealroom_id, event_type, event_data, session_id } = body;

    if (!dealroom_id || !event_type || !session_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Whitelist allowed event types
    const allowedEvents = [
      'page_view', 'tab_switch', 'scroll', 'video_play', 'video_pause',
      'document_click', 'link_click', 'faq_toggle', 'session_start', 'session_end',
      'cta_click', 'reference_view', 'time_on_page',
    ];
    if (!allowedEvents.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
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
