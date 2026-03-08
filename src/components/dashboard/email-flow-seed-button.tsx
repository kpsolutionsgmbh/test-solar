'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export function EmailFlowSeedButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-flows/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.created || 4} Standard-Flows erstellt`);
        router.refresh();
      } else {
        toast.error(data.error || 'Fehler beim Erstellen');
      }
    } catch {
      toast.error('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[#e5e7eb] rounded-xl">
      <div className="h-12 w-12 rounded-xl bg-[#fafafa] flex items-center justify-center mb-4">
        <Mail size={20} className="text-[#6b7280]" />
      </div>
      <h3 className="text-[15px] font-semibold text-[#1a1a1a] mb-1">
        Keine E-Mail Flows vorhanden
      </h3>
      <p className="text-[13px] text-[#6b7280] max-w-[340px] mb-5">
        Erstellen Sie die 4 Standard-Flows mit einem Klick. Sie können diese anschließend anpassen und aktivieren.
      </p>
      <Button onClick={handleSeed} disabled={loading} size="sm">
        <Mail size={14} className="mr-1.5" />
        {loading ? 'Wird erstellt...' : 'Standard-Flows erstellen'}
      </Button>
    </div>
  );
}
