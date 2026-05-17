import { getGlobalContent } from '@/lib/global-content';
import { GlobalContentEditor } from '@/components/dashboard/global-content-editor';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Standard-Inhalte' };
export const dynamic = 'force-dynamic';

export default async function GlobalContentPage() {
  const content = await getGlobalContent();
  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-fg">Standard-Inhalte</h1>
        <p className="text-sm text-fg-muted mt-1 max-w-2xl">
          Texte, die in jedem Angebotsraum gleich erscheinen (Über uns, So
          einfach geht&apos;s, Final-CTA, Trust-Strip). Eine Änderung hier wirkt
          sofort auf alle bestehenden und zukünftigen Dealrooms.
        </p>
      </div>
      <GlobalContentEditor initial={content} />
    </div>
  );
}
