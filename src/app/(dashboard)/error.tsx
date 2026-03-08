'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
      <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">
        Fehler beim Laden
      </h2>
      <p className="text-sm text-[#6b7280] mb-5 max-w-sm">
        Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut oder kehren Sie zur Übersicht zurück.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Zur Übersicht
        </Button>
        <Button onClick={reset}>Erneut versuchen</Button>
      </div>
    </div>
  );
}
