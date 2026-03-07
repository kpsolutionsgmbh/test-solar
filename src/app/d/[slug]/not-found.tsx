import Image from 'next/image';
import { Link2Off } from 'lucide-react';

export default function DealroomNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#fafafa]">
      <Image src="/images/logo-blue.svg" alt="Gündesli & Kollegen" width={180} height={36} />

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
        <p>📞 <a href="tel:022615016320" className="text-[#11485e] hover:underline">02261/5016320</a></p>
        <p>✉️ <a href="mailto:info@guendesliundkollegen.de" className="text-[#11485e] hover:underline">info@guendesliundkollegen.de</a></p>
      </div>

      <a
        href="https://guendesliundkollegen.de"
        className="mt-8 h-9 px-6 inline-flex items-center bg-[#11485e] text-white text-sm font-semibold rounded-lg hover:bg-[#41697d] transition-colors"
      >
        Zur Website
      </a>
    </div>
  );
}
