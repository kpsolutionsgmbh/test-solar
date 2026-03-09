import Image from 'next/image';
import { Link2Off } from 'lucide-react';

export default function DealroomNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#FAFAF8]">
      <Image src="/images/logo-blue.svg" alt="Solarheld" width={180} height={36} />

      <div className="mt-12 mb-6">
        <Link2Off size={48} className="text-[#6b7280] mx-auto" />
      </div>

      <h2 className="text-2xl font-semibold text-[#1a1a1a]">
        Dieser Link ist nicht mehr aktiv.
      </h2>
      <p className="text-base text-[#6b7280] mt-3 max-w-md">
        Das Angebot, das Sie suchen, ist leider nicht mehr verfügbar.
        Bei Fragen erreichen Sie uns gerne direkt.
      </p>

      <div className="mt-8 space-y-2 text-sm text-[#6b7280]">
        <p>✉️ <a href="mailto:info@solarheld.de" className="text-[#E97E1C] hover:underline">info@solarheld.de</a></p>
      </div>

      <a
        href="https://solarheld.de"
        className="mt-8 h-9 px-6 inline-flex items-center bg-[#E97E1C] text-white text-sm font-semibold rounded-lg hover:bg-[#D06A0F] transition-colors"
      >
        Zur Website
      </a>
    </div>
  );
}
