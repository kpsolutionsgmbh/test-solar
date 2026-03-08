import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const dealroomId = request.nextUrl.searchParams.get('id');

  if (!dealroomId) {
    return new NextResponse(htmlPage('Ungültiger Link', 'Der Abmelde-Link ist ungültig.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient
    .from('dealrooms')
    .update({ email_unsubscribed: true })
    .eq('id', dealroomId);

  if (error) {
    return new NextResponse(htmlPage('Fehler', 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new NextResponse(
    htmlPage(
      'Erfolgreich abgemeldet',
      'Sie erhalten keine weiteren automatischen E-Mails zu diesem Angebot.'
    ),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; color: #374151; }
    .card { background: white; border-radius: 12px; padding: 48px; text-align: center; max-width: 420px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { font-size: 20px; color: #1a1a1a; margin: 0 0 12px; }
    p { font-size: 15px; color: #6b7280; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
