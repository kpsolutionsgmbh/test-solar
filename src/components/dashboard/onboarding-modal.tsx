'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const handleCreateFirst = () => {
    onClose();
    router.push('/dashboard/new');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {step === 0 && (
          <div className="flex flex-col items-center text-center px-8 py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#11485e]/10 mb-6">
              <Rocket className="h-7 w-7 text-[#11485e]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">
              Willkommen bei Glow&Growth
            </h2>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-8">
              Ihr neues Tool, um professionelle Angebotsräume für Ihre Kunden
              zu erstellen. Beeindrucken Sie Interessenten mit personalisierten,
              interaktiven Seiten &ndash; alles an einem Ort.
            </p>
            <Button
              className="w-full bg-[#11485e] hover:bg-[#11485e]/90"
              onClick={() => setStep(1)}
            >
              Los geht&apos;s
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center text-center px-8 py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#11485e]/10 mb-6">
              <Sparkles className="h-7 w-7 text-[#11485e]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">
              Ihr erster Angebotsraum
            </h2>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
              Mit Glow&Growth erstellen Sie individuelle Angebotsräume für
              Ihre Kunden. So funktioniert es:
            </p>
            <ul className="text-sm text-[#6b7280] text-left space-y-2 mb-8 w-full">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#11485e]/10 text-[10px] font-semibold text-[#11485e] mt-0.5">
                  1
                </span>
                Kundendaten eingeben &ndash; Name, Unternehmen und Produkt.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#11485e]/10 text-[10px] font-semibold text-[#11485e] mt-0.5">
                  2
                </span>
                KI generiert automatisch passgenauen Content.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#11485e]/10 text-[10px] font-semibold text-[#11485e] mt-0.5">
                  3
                </span>
                Veröffentlichen und den Link mit Ihrem Kunden teilen.
              </li>
            </ul>
            <Button
              className="w-full bg-[#11485e] hover:bg-[#11485e]/90"
              onClick={() => setStep(2)}
            >
              Weiter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center px-8 py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#11485e]/10 mb-6">
              <CheckCircle2 className="h-7 w-7 text-[#11485e]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">
              Alles bereit!
            </h2>
            <p className="text-sm text-[#6b7280] leading-relaxed mb-8">
              Sie sind startklar. Erstellen Sie jetzt Ihren ersten
              Angebotsraum und überzeugen Sie Ihre Kunden mit einem
              professionellen, digitalen Erlebnis.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <Button
                className="w-full bg-[#11485e] hover:bg-[#11485e]/90"
                onClick={handleCreateFirst}
              >
                Ersten Angebotsraum erstellen
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-[#6b7280]"
                onClick={onClose}
              >
                Später
              </Button>
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-[#11485e]'
                  : 'w-1.5 bg-[#e5e7eb]'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
