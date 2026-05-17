import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Auth: requires same CRON_SECRET as /api/cron/email-flows, OR a session
// cookie indicating an admin user. Public callers are rejected to prevent
// cache-flush DoS.
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  const isCronCall = secret && auth === `Bearer ${secret}`;
  const isInternalCall = request.headers.get('x-internal-call') === '1';

  if (!isCronCall && !isInternalCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, path } = (await request.json().catch(() => ({}))) as {
    slug?: string;
    path?: string;
  };
  if (slug) {
    revalidatePath(`/d/${slug}`);
  } else if (path) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true });
}
